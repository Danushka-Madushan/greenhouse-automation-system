#pragma once

#ifndef GREENOS_HPP
#define GREENOS_HPP

#include <Arduino.h>

namespace GreenOS
{
  class EventHandler
  {
  private:
    HardwareSerial *serial;

  public:
    EventHandler(HardwareSerial *serial);

    void onReceive(String &incoming);
    void emitLightIntensity(float lightIntensity);
    void emitTemperatureHumidity(float temperature, float humidity);
    void emitDH22Error(const String &errorMessage);
    void emitWaterLevel(float waterLevel);
    void emitSoilMoisture(int rawAnalog);
  };

  class Ultrasonic
  {
  private:
    float readDistanceCM();
    float TANK_EMPTY_DISTANCE = 10.0;
    float TANK_FULL_DISTANCE = 2.0;
    float previousSmoothedPercent = -1.0;
    int _trigPin;
    int _echoPin;

  public:
    Ultrasonic(int trigPin, int echoPin);

    float getFilteredDistance(int samples);
    float calculatePercentage(float distance);
  };
}

#endif
