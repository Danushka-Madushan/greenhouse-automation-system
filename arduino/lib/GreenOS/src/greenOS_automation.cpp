#include <Arduino.h>
#include "greenOS_automation.hpp"

using namespace GreenOS;

/* ── Constructor ──────────────────────────────────────────── */

AutomationController::AutomationController(int pinWaterPump, int pinFan, int pinRefillPump)
    : _pinWaterPump(pinWaterPump), _pinFan(pinFan), _pinRefillPump(pinRefillPump)
{
}

/* ── Mode Control ─────────────────────────────────────────── */

void AutomationController::setMode(OperatingMode mode)
{
  if (_mode == mode)
    return;
  _mode = mode;

  if (_mode == OperatingMode::MANUAL)
  {
    /* Cancel every actuator that was running under AUTO control.
     * Manual actuators (fan, pump) commanded by the UI remain until
     * the user explicitly turns them off. */
    cancelAutoActuators(millis());
  }
}

OperatingMode AutomationController::getMode() const { return _mode; }
bool AutomationController::isAutoMode() const { return _mode == OperatingMode::AUTO; }

/* ── Actuator State Queries ───────────────────────────────── */

bool AutomationController::isFanOn() const { return _fanOn; }
bool AutomationController::isWaterPumpOn() const { return _waterPumpOn; }
bool AutomationController::isRefillPumpOn() const { return _refillPumpOn; }

/* ── Manual Actuator Overrides ────────────────────────────── */

void AutomationController::setFan(bool on)
{
  if (_fanOn == on)
    return;
  _fanOn = on;
  _fanAutoTriggered = false; /* manual override clears auto flag */
  applyRelays();
}

void AutomationController::setWaterPump(bool on, unsigned long durationMs, unsigned long currentMillis)
{
  _waterPumpOn = on;
  _waterPumpRunUntilMs = on ? (currentMillis + durationMs) : 0;
  applyRelays();
}

void AutomationController::setRefillPump(bool on)
{
  if (_refillPumpOn == on)
    return;
  _refillPumpOn = on;
  applyRelays();
}

/* ── Per-loop update ──────────────────────────────────────── */

bool AutomationController::update(float moisture, float waterLevel, float temperature,
                                  float humidity, unsigned long currentMillis)
{
  bool changed = false;

  /* ── Water pump timer expiry (applies in both modes) ─── */
  if (_waterPumpOn && currentMillis >= _waterPumpRunUntilMs)
  {
    _waterPumpOn = false;
    applyRelays();
    changed = true;
  }

  if (_mode != OperatingMode::AUTO)
    return changed;

  /* ════════════════════════════════════════════════════════
     AUTO MODE LOGIC — evaluate sensors and drive actuators
     ════════════════════════════════════════════════════════ */

  /* ── Exhaust Fan ─────────────────────────────────────── */
  bool conditionHigh = (temperature > AUTO_TEMP_HIGH) || (humidity > AUTO_HUM_HIGH);
  bool conditionLow = (temperature <= AUTO_TEMP_RECOVER) && (humidity <= AUTO_HUM_RECOVER);

  if (conditionHigh && !_fanOn)
  {
    unsigned long elapsed = currentMillis - _fanLastToggleMs;
    if (elapsed >= FAN_COOLDOWN_MS || _fanLastToggleMs == 0)
    {
      _fanOn = true;
      _fanAutoTriggered = true;
      _fanLastToggleMs = currentMillis;
      applyRelays();
      changed = true;
    }
  }
  else if (conditionLow && _fanOn && _fanAutoTriggered)
  {
    unsigned long elapsed = currentMillis - _fanLastToggleMs;
    if (elapsed >= FAN_COOLDOWN_MS)
    {
      _fanOn = false;
      _fanAutoTriggered = false;
      _fanLastToggleMs = currentMillis;
      applyRelays();
      changed = true;
    }
  }

  /* ── Water Pump ──────────────────────────────────────── */
  /* Priority: if the tank is low OR the refill pump is actively
   * filling, skip irrigation entirely — there is no point running
   * the water pump dry.  Once the tank reaches AUTO_WATER_TANK_LOW
   * + hysteresis the refill pump will stop and irrigation can resume
   * on the very next update() cycle. */
  bool tankSufficientForIrrigation = (waterLevel >= AUTO_WATER_TANK_LOW) && !_refillPumpOn;
  if (!_waterPumpOn && moisture < AUTO_MOISTURE_LOW && tankSufficientForIrrigation)
  {
    unsigned long elapsed = currentMillis - _waterPumpLastTriggerMs;
    if (elapsed >= WATER_PUMP_COOLDOWN_MS || _waterPumpLastTriggerMs == 0)
    {
      _waterPumpOn = true;
      _waterPumpRunUntilMs = currentMillis + WATER_PUMP_DURATION_MS;
      _waterPumpLastTriggerMs = currentMillis;
      applyRelays();
      changed = true;
    }
  }

  /* ── Refill Pump ─────────────────────────────────────── */
  if (!_refillPumpOn && waterLevel < AUTO_WATER_TANK_LOW)
  {
    _refillPumpOn = true;
    applyRelays();
    changed = true;
  }
  else if (_refillPumpOn && waterLevel >= AUTO_WATER_TANK_FULL)
  {
    _refillPumpOn = false;
    applyRelays();
    changed = true;
  }

  return changed;
}

/* ── Private Helpers ──────────────────────────────────────── */

void AutomationController::applyRelays()
{
  /* Active-low relay module: LOW = ON, HIGH = OFF */
  digitalWrite(_pinFan, _fanOn ? LOW : HIGH);
  digitalWrite(_pinWaterPump, _waterPumpOn ? LOW : HIGH);
  digitalWrite(_pinRefillPump, _refillPumpOn ? LOW : HIGH);
}

void AutomationController::cancelAutoActuators(unsigned long currentMillis)
{
  bool changed = false;

  if (_fanAutoTriggered && _fanOn)
  {
    _fanOn = false;
    _fanAutoTriggered = false;
    changed = true;
  }

  /* Only cancel water pump if it was AUTO-triggered (still within auto window) */
  if (_waterPumpOn && _waterPumpLastTriggerMs > 0)
  {
    _waterPumpOn = false;
    _waterPumpRunUntilMs = 0;
    changed = true;
  }

  if (_refillPumpOn)
  {
    _refillPumpOn = false;
    changed = true;
  }

  if (changed)
    applyRelays();
}
