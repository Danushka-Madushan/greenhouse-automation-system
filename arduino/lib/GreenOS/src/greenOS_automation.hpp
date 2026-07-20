#pragma once

#ifndef GREENOS_AUTOMATION_HPP
#define GREENOS_AUTOMATION_HPP

#include <Arduino.h>

namespace GreenOS
{
  enum class OperatingMode
  {
    MANUAL,
    AUTO
  };

  /**
   * AutomationController
   *
   * Manages the greenhouse operating mode (MANUAL / AUTO) and
   * evaluates sensor readings to autonomously control actuators
   * when in AUTO mode.
   *
   * Design goals:
   *  - Fully non-blocking: no delay() calls
   *  - Safe defaults: boots in MANUAL so no actuator fires on power-up
   *  - Cooldown timers prevent rapid cycling of pumps / fan
   *  - Switching back to MANUAL immediately stops any auto-triggered actuator
   */
  class AutomationController
  {
  public:
    /* ── Automation Thresholds ──────────────────────────── */
    static constexpr float AUTO_MOISTURE_LOW = 30.0f;    // % — trigger water pump
    static constexpr float AUTO_WATER_TANK_LOW = 20.0f;  // % — activate refill pump
    static constexpr float AUTO_WATER_TANK_FULL = 80.0f; // % — deactivate refill pump
    static constexpr float AUTO_TEMP_HIGH = 32.0f;       // °C — turn fan ON
    static constexpr float AUTO_TEMP_RECOVER = 28.0f;    // °C — turn fan OFF (hysteresis)
    static constexpr float AUTO_HUM_HIGH = 80.0f;        // % — turn fan ON
    static constexpr float AUTO_HUM_RECOVER = 70.0f;     // % — turn fan OFF (hysteresis)

    /* ── Cooldown Durations ─────────────────────────────── */
    static constexpr unsigned long WATER_PUMP_DURATION_MS = 5000UL;  // pump run time in AUTO
    static constexpr unsigned long WATER_PUMP_COOLDOWN_MS = 60000UL; // 60 s between auto triggers
    static constexpr unsigned long FAN_COOLDOWN_MS = 30000UL;        // 30 s between auto toggles

    /* ── Constructor ────────────────────────────────────── */
    AutomationController(int pinWaterPump, int pinFan, int pinRefillPump);

    /* ── Mode Control ───────────────────────────────────── */
    void setMode(OperatingMode mode);
    OperatingMode getMode() const;
    bool isAutoMode() const;

    /* ── Per-loop update ────────────────────────────────── */
    /**
     * Call once every loop() iteration.
     * In AUTO mode: evaluates thresholds and drives actuators.
     * In MANUAL mode: only handles pump timer expiry.
     * Returns true if any actuator state changed (caller should emit STATUS).
     */
    bool update(float moisture, float waterLevel, float temperature, float humidity, unsigned long currentMillis);

    /* ── Actuator State Queries ─────────────────────────── */
    bool isFanOn() const;
    bool isWaterPumpOn() const;
    bool isRefillPumpOn() const;

    /* ── Manual Actuator Overrides (respected in MANUAL mode) ─── */
    void setFan(bool on);
    void setWaterPump(bool on, unsigned long durationMs, unsigned long currentMillis);
    void setRefillPump(bool on);

  private:
    int _pinWaterPump;
    int _pinFan;
    int _pinRefillPump;

    OperatingMode _mode = OperatingMode::MANUAL;

    /* Actuator physical state */
    bool _fanOn = false;
    bool _waterPumpOn = false;
    bool _refillPumpOn = false;

    /* Tracks whether the fan was turned on by AUTO logic (for hysteresis OFF) */
    bool _fanAutoTriggered = false;

    /* Water pump timer */
    unsigned long _waterPumpRunUntilMs = 0;

    /* Cooldown timestamps */
    unsigned long _waterPumpLastTriggerMs = 0;
    unsigned long _fanLastToggleMs = 0;

    /* Apply physical relay states — relay is ACTIVE-LOW */
    void applyRelays();

    /* Cancel all auto-managed actuators immediately */
    void cancelAutoActuators(unsigned long currentMillis);
  };
}

#endif
