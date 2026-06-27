#pragma once

#ifndef GREENOS_EVENTS_HPP
#define GREENOS_EVENTS_HPP

#include <Arduino.h>

namespace GreenOS
{
  namespace Events
  {
    /* Incoming Events (Will live in Flash Memory via PROGMEM) */
    namespace Incoming
    {
      /* System Check Event */
      const char* const WHOAMI PROGMEM = "SYS:WHOAMI";
      const char* const OFF_PUMP PROGMEM = "CMD:OFF_PUMP";
    }

    /* Outgoing Events */
    namespace Emit
    {
      /* System Check Response */
      const char* const GREENHOUSE_UNO PROGMEM = "SYS:GREENHOUSE_UNO";
      const char* const MOISTURE_DATA_DYN PROGMEM = "STATUS:MOISTURE_SENSOR:";
    }
  }
}

#endif
