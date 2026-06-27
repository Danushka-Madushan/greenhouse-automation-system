#include <Arduino.h>
#include "greenOS.hpp"
#include "greenOS_events.hpp"

using namespace GreenOS;

EventHandler::EventHandler(HardwareSerial *serial) : serial(serial) {}

void EventHandler::onReceive()
{
  if (serial->available() > 0)
  {
    String incoming = serial->readStringUntil('\n');
    incoming.trim();

    /**
     * Arduino strings can check equality against PROGMEM pointers
     * safely using the built-in flash string helper wrapper
     * __FlashStringHelper is used to reduce RAM usage by storing
     * constant strings in flash memory instead of SRAM
     */
    /* System Check Event */
    if (incoming == (const __FlashStringHelper *)Events::Incoming::WHOAMI)
    {
      serial->println((const __FlashStringHelper *)Events::Emit::GREENHOUSE_UNO);
    }
  }
}
