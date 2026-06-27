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
    }

    /* Outgoing Events */
    namespace Emit
    {
      /* System Check Response */
      const char* const GREENHOUSE_UNO PROGMEM = "SYS:GREENHOUSE_UNO";
      /* Temperature and Humidity Data */
      const char* const TEMP_HUMIDITY_DATA_DYN PROGMEM = "STATUS:TEMP_HUMIDITY:";
      /* Error */
      const char* const ERROR_DH22_MSG_DYN PROGMEM = "ERR:SENSOR_DH22:";
    }
  }
}

#endif
