#include <Arduino.h>
#include <DHT.h>
#include "greenOS.hpp"
#include "greenOS_events.hpp"
#include "greenOS_automation.hpp"

#define DHTPIN 2
#define DHTTYPE DHT22

#define LDR_PIN A0
/* Soil Moisture v1.2 Analog */
#define MOISTURE_PIN A1

#define ECHO_PIN 3
#define TRIG_PIN 4

/* Actuator Pins */
#define RELAY_WATER_PUMP 5
#define RELAY_FAN 6
#define RELAY_REFILL_PUMP 8

using namespace GreenOS;

/*  Declare a global pointer initialized to nullptr for EventHandler & Ultrasonic */
EventHandler *handler = nullptr;
Ultrasonic *ultrasonic = nullptr;

/* AutomationController — owns all actuator state and auto-mode logic */
AutomationController *automation = nullptr;

/*  Declare the DHT22 / AM2302 Module sensor object */
DHT dht(DHTPIN, DHTTYPE);

/* Timing variables for non-blocking execution */
unsigned long dht_lastReadTime = 0;
const unsigned long dht_readInterval = 2000; // Read every 2000ms (2 seconds)

unsigned long ldr_lastReadTime = 0;
const unsigned long ldr_readInterval = 1000; // Read every 1000ms (1 second)

unsigned long ultrasonic_lastReadTime = 0;
const unsigned long ultrasonic_readInterval = 1000; // Read every 1000ms (1 second)

unsigned long moisture_lastReadTime = 0;
const int DRY_VALUE = 461;
const int WET_VALUE = 150;
const unsigned long moisture_readInterval = 1000; // Read every 1000ms (1 second)

/* Emit Data Interval */
unsigned long previousEmitMillis = 0;
const long emitInterval = 500; // Interval at which to send data (milliseconds)

/* Latest sensor values — cached for AutomationController.update() */
float latestMoisture = 0.0f;
float latestWaterLevel = 0.0f;
float latestTemperature = 0.0f;
float latestHumidity = 0.0f;

/* ── Emit Helpers ─────────────────────────────────────────── */

void emitModeStatus()
{
  Serial.print(Events::Emit::MODE_STATUS_DYN);
  Serial.println(automation->isAutoMode() ? "AUTO" : "MANUAL");
}

void emitExhaustFanStatus()
{
  Serial.print(Events::Emit::EXHAUST_FAN_STATUS_DYN);
  Serial.println(automation->isFanOn() ? "ON" : "OFF");
}

void emitWaterPumpStatus(unsigned long currentMillis)
{
  Serial.print(Events::Emit::WATER_PUMP_STATUS_DYN);
  if (automation->isWaterPumpOn())
  {
    /* Remaining time is managed inside the controller; approximate from millis */
    Serial.print("RUNNING:");
    Serial.println(0); // exact countdown not exposed; UI treats any RUNNING as active
  }
  else
  {
    Serial.println("OFF");
  }
}

void emitRefillPumpStatus()
{
  Serial.print(Events::Emit::REFILL_PUMP_STATUS_DYN);
  Serial.println(automation->isRefillPumpOn() ? "ON" : "OFF");
}

void emitExhaustFanAck(const char *result)
{
  Serial.print(Events::Emit::EXHAUST_FAN_ACK_DYN);
  Serial.println(result);
}

void emitWaterPumpAck(const char *result)
{
  Serial.print(Events::Emit::WATER_PUMP_ACK_DYN);
  Serial.println(result);
}

void emitRefillPumpAck(const char *result)
{
  Serial.print(Events::Emit::REFILL_PUMP_ACK_DYN);
  Serial.println(result);
}

void emitModeAck(const char *result)
{
  Serial.print(Events::Emit::MODE_ACK_DYN);
  Serial.println(result);
}

/* ── Command Handler ──────────────────────────────────────── */

void handleActuatorCommand(String incoming, unsigned long currentMillis)
{
  incoming.trim();

  /* ── Operating Mode Commands ─────────────────────────── */
  if (incoming == Events::Incoming::MODE_AUTO)
  {
    automation->setMode(OperatingMode::AUTO);
    emitModeAck("OK:AUTO");
    emitModeStatus();
    /* Immediately broadcast all actuator states after mode switch */
    emitExhaustFanStatus();
    emitWaterPumpStatus(currentMillis);
    emitRefillPumpStatus();
    return;
  }

  if (incoming == Events::Incoming::MODE_MANUAL)
  {
    automation->setMode(OperatingMode::MANUAL);
    emitModeAck("OK:MANUAL");
    emitModeStatus();
    /* Broadcast stopped actuators after cancellation */
    emitExhaustFanStatus();
    emitWaterPumpStatus(currentMillis);
    emitRefillPumpStatus();
    return;
  }

  /* ── Exhaust Fan Commands ─────────────────────────────── */
  if (incoming == Events::Incoming::EXHAUST_FAN_ON)
  {
    automation->setFan(true);
    emitExhaustFanAck("OK:ON");
    emitExhaustFanStatus();
    return;
  }

  if (incoming == Events::Incoming::EXHAUST_FAN_OFF)
  {
    automation->setFan(false);
    emitExhaustFanAck("OK:OFF");
    emitExhaustFanStatus();
    return;
  }

  /* ── Water Pump Command ───────────────────────────────── */
  if (incoming.startsWith(Events::Incoming::WATER_PUMP_RUN_SECONDS_DYN))
  {
    String secondsText = incoming.substring(strlen(Events::Incoming::WATER_PUMP_RUN_SECONDS_DYN));
    secondsText.trim();
    long seconds = secondsText.toInt();

    if (seconds <= 0)
    {
      emitWaterPumpAck("INVALID_SECONDS");
      return;
    }

    unsigned long durationMs = (unsigned long)seconds * 1000UL;
    automation->setWaterPump(true, durationMs, currentMillis);
    emitWaterPumpAck("OK:RUNNING");
    emitWaterPumpStatus(currentMillis);
    return;
  }

  /* ── Refill Pump Commands ─────────────────────────────── */
  if (incoming == Events::Incoming::REFILL_PUMP_ON)
  {
    automation->setRefillPump(true);
    emitRefillPumpAck("OK:ON");
    emitRefillPumpStatus();
    return;
  }

  if (incoming == Events::Incoming::REFILL_PUMP_OFF)
  {
    automation->setRefillPump(false);
    emitRefillPumpAck("OK:OFF");
    emitRefillPumpStatus();
    return;
  }
}

/* ── Setup ────────────────────────────────────────────────── */

void setup()
{
  Serial.begin(9600);
  pinMode(LDR_PIN, INPUT);
  pinMode(MOISTURE_PIN, INPUT);

  pinMode(ECHO_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);

  /* Set relay pins HIGH (OFF) before setting as OUTPUT to avoid a glitch pulse */
  digitalWrite(RELAY_WATER_PUMP, HIGH);
  pinMode(RELAY_WATER_PUMP, OUTPUT);

  digitalWrite(RELAY_FAN, HIGH);
  pinMode(RELAY_FAN, OUTPUT);

  digitalWrite(RELAY_REFILL_PUMP, HIGH);
  pinMode(RELAY_REFILL_PUMP, OUTPUT);

  /* Ensure trigger pin starts clean */
  digitalWrite(TRIG_PIN, LOW);

  /* Instantiate GreenOS objects once Serial is ready */
  handler = new EventHandler(&Serial);
  ultrasonic = new Ultrasonic(TRIG_PIN, ECHO_PIN);

  /* AutomationController — boots in MANUAL; nothing fires on power-up */
  automation = new AutomationController(RELAY_WATER_PUMP, RELAY_FAN, RELAY_REFILL_PUMP);

  dht.begin();

  /* Announce boot mode so C# / WebUI can sync state immediately */
  emitModeStatus();
}

/* ── Loop ─────────────────────────────────────────────────── */

void loop()
{
  unsigned long currentMillis = millis();

  /* Run the automation controller — handles timer expiry + auto logic */
  bool actuatorChanged = automation->update(
    latestMoisture, latestWaterLevel,
    latestTemperature, latestHumidity,
    currentMillis
  );

  /* If auto-mode changed any actuator, broadcast the new states */
  if (actuatorChanged)
  {
    emitExhaustFanStatus();
    emitWaterPumpStatus(currentMillis);
    emitRefillPumpStatus();
  }

  /* ── Incoming Commands ────────────────────────────────── */
  if (Serial.available() > 0)
  {
    String incoming = Serial.readStringUntil('\n');
    handleActuatorCommand(incoming, currentMillis);
    handler->onReceive(incoming);
  }

  /* ── Sensor Reads & Emit ──────────────────────────────── */
  if (currentMillis - previousEmitMillis >= emitInterval)
  {
    previousEmitMillis = currentMillis;

    if (handler != nullptr)
    {
      /* Read Soil Moisture */
      if (currentMillis - moisture_lastReadTime >= moisture_readInterval)
      {
        moisture_lastReadTime = currentMillis;

        int rawAnalog = analogRead(MOISTURE_PIN);
        int moisturePercent = map(rawAnalog, DRY_VALUE, WET_VALUE, 0, 100);
        moisturePercent = constrain(moisturePercent, 0, 100);
        latestMoisture = (float)moisturePercent;

        if (Serial.availableForWrite())
        {
          handler->emitSoilMoisture(moisturePercent);
        }
      }

      /* Read distance from ultrasonic sensor */
      if (currentMillis - ultrasonic_lastReadTime >= ultrasonic_readInterval)
      {
        ultrasonic_lastReadTime = currentMillis;

        float distanceCM = ultrasonic->getFilteredDistance(10);
        float waterLevelPercent = ultrasonic->calculatePercentage(distanceCM);
        latestWaterLevel = waterLevelPercent;

        if (Serial.availableForWrite())
        {
          handler->emitWaterLevel(waterLevelPercent);
        }
      }

      /* Read light intensity */
      if (currentMillis - ldr_lastReadTime >= ldr_readInterval)
      {
        ldr_lastReadTime = currentMillis;

        int rawAnalog = analogRead(LDR_PIN);

        if (Serial.availableForWrite())
        {
          handler->emitLightIntensity(rawAnalog);
        }
      }

      /* Read DHT22 every 2 seconds */
      if (currentMillis - dht_lastReadTime >= dht_readInterval)
      {
        dht_lastReadTime = currentMillis;

        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();

        if (isnan(temperature) || isnan(humidity))
        {
          handler->emitDH22Error("Failed_to_read_from_DHT22_sensor");
          return;
        }

        latestTemperature = temperature;
        latestHumidity = humidity;

        if (Serial.availableForWrite())
        {
          handler->emitTemperatureHumidity(temperature, humidity);
        }
      }
    }
  }
}
