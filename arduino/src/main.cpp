#include <Arduino.h>
#include <DHT.h>
#include "greenOS.hpp"

#define DHTPIN 2
#define DHTTYPE DHT22

#define LDR_PIN A0
/* Soil Moisture v1.2 Analog */
#define MOISTURE_PIN A1

#define ECHO_PIN 3
#define TRIG_PIN 4

using namespace GreenOS;

/*  Declare a global pointer initialized to nullptr for EventHandler & Ultrasonic */
EventHandler *handler = nullptr;
Ultrasonic *ultrasonic = nullptr;
/*  Declare the DHT22 / AM2302 Module sensor object */
DHT dht(DHTPIN, DHTTYPE);

/* Timing variables for non-blocking execution */
unsigned long dht_lastReadTime = 0;
const unsigned long dht_readInterval = 2000; // Read every 2000ms (2 seconds)

unsigned long ldr_lastReadTime = 0;
const unsigned long ldr_readInterval = 1000; // Read every 1000ms (1 second)

/* Timing variables for non-blocking execution */
unsigned long ultrasonic_lastReadTime = 0;
const unsigned long ultrasonic_readInterval = 1000; // Read every 1000ms (1 second)

unsigned long moisture_lastReadTime = 0;
const int DRY_VALUE = 461;
const int WET_VALUE = 150;
const unsigned long moisture_readInterval = 1000; // Read every 1000ms (1 second)

/* Emit Data Interval */
unsigned long previousEmitMillis = 0;
const long emitInterval = 500; // Interval at which to send data (milliseconds)
bool isConnected = false;

/* Actuator Pins */
#define RELAY_WATER_PUMP 5
#define RELAY_FAN 6

void setup()
{
  Serial.begin(9600);
  pinMode(LDR_PIN, INPUT);
  pinMode(MOISTURE_PIN, INPUT);

  pinMode(ECHO_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);

  /* Close on Start */
  digitalWrite(RELAY_WATER_PUMP, HIGH);
  pinMode(RELAY_WATER_PUMP, OUTPUT);
  digitalWrite(RELAY_FAN, HIGH);
  pinMode(RELAY_FAN, OUTPUT);

  /* Ensure trigger pin starts clean */
  digitalWrite(TRIG_PIN, LOW);

  /* Instantiate the EventHandler & Ultrasonic sensors safely now, when the Serial is ready */
  handler = new EventHandler(&Serial);
  ultrasonic = new Ultrasonic(TRIG_PIN, ECHO_PIN);
  dht.begin();
}

void loop()
{
  unsigned long currentMillis = millis();

  /* Trigger on Incomming */
  if (Serial.available() > 0)
  {
    /* Handle Incomming Events */
    String incoming = Serial.readStringUntil('\n');
    handler->onReceive(incoming);
  }

  if (currentMillis - previousEmitMillis >= emitInterval)
  {
    previousEmitMillis = currentMillis;

    if (handler != nullptr)
    {
      /* Read Soil Moisture */

      if (currentMillis - moisture_lastReadTime >= moisture_readInterval)
      {
        moisture_lastReadTime = currentMillis;

        /* Read the raw analog value (0 - 1023) */
        int rawAnalog = analogRead(MOISTURE_PIN);
        int moisturePercent = map(rawAnalog, DRY_VALUE, WET_VALUE, 0, 100);
        moisturePercent = constrain(moisturePercent, 0, 100);

        /* Emit soil moisture data */
        if (Serial.availableForWrite())
        {
          handler->emitSoilMoisture(moisturePercent);
        }
      }

      /* Read distance from ultrasonic sensor */
      if (currentMillis - ultrasonic_lastReadTime >= ultrasonic_readInterval)
      {
        ultrasonic_lastReadTime = currentMillis;

        /* Read distance in centimeters */
        float distanceCM = ultrasonic->getFilteredDistance(10);
        float waterLevelPercent = ultrasonic->calculatePercentage(distanceCM);

        /* Emit distance data */
        if (Serial.availableForWrite())
        {
          handler->emitWaterLevel(waterLevelPercent);
        }
      }

      /* Read light intensity */
      if (currentMillis - ldr_lastReadTime >= ldr_readInterval)
      {
        ldr_lastReadTime = currentMillis;

        /* Read the raw analog value (0 - 1023) */
        int rawAnalog = analogRead(LDR_PIN);

        /* Emit light intensity data */
        if (Serial.availableForWrite())
        {
          handler->emitLightIntensity(rawAnalog);
        }
      }

      /* Read sensor data every 2 seconds (DHT22 needs at least 2 seconds between reads) */
      if (currentMillis - dht_lastReadTime >= dht_readInterval)
      {
        dht_lastReadTime = currentMillis;

        /* Read temperature as Celsius (the default) */
        float temperature = dht.readTemperature();
        /* Reading temperature or humidity takes about 250 milliseconds! */
        float humidity = dht.readHumidity();

        /* Check if any reads failed and exit early (to try again next interval) */
        if (isnan(temperature) || isnan(humidity))
        {
          handler->emitDH22Error("Failed_to_read_from_DHT22_sensor");
          return;
        }

        /* Emit temperature and humidity data */
        if (Serial.availableForWrite())
        {
          handler->emitTemperatureHumidity(temperature, humidity);
        }
      }
    }
  }
}
