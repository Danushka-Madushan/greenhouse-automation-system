#include <Arduino.h>
#include "greenOS.hpp"
#include "greenOS_events.hpp"

using namespace GreenOS;

EventHandler::EventHandler(HardwareSerial *serial) : serial(serial) {}

void EventHandler::onReceive(String &incoming)
{
  /* System Check Event */
  if (incoming == Events::Incoming::WHOAMI)
  {
    serial->println(Events::Emit::GREENHOUSE_UNO);
  }
}

void EventHandler::emitTemperatureHumidity(float temperature, float humidity)
{
  String data = String(temperature, 1) + "," + String(humidity, 1);
  String event = String(Events::Emit::TEMP_HUMIDITY_DATA_DYN) + data;
  serial->println(event);
}

void EventHandler::emitDH22Error(const String &errorMessage)
{
  String event = String(Events::Emit::ERROR_DH22_MSG_DYN) + errorMessage;
  serial->println(event);
}
