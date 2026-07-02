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

      /* Actuator Commands */
      const char* const EXHAUST_FAN_ON PROGMEM = "CMD:EXHAUST_FAN:ON";
      const char* const EXHAUST_FAN_OFF PROGMEM = "CMD:EXHAUST_FAN:OFF";
      const char* const WATER_PUMP_RUN_SECONDS_DYN PROGMEM = "CMD:WATER_PUMP:RUN_SECONDS:";
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
      /* Light Intensity Data */
      const char* const LIGHT_INTENSITY_DATA_DYN PROGMEM = "STATUS:LIGHT_INTENSITY:";
      /* Water Level Data */
      const char* const WATER_LEVEL_DATA_DYN PROGMEM = "STATUS:WATER_LEVEL:";
      /* Soil Moisture Data */
      const char* const SOIL_MOISTURE_DATA_DYN PROGMEM = "STATUS:SOIL_MOISTURE:";

      /* Actuator Status Updates */
      const char* const EXHAUST_FAN_STATUS_DYN PROGMEM = "STATUS:EXHAUST_FAN:";
      const char* const WATER_PUMP_STATUS_DYN PROGMEM = "STATUS:WATER_PUMP:";

      /* Actuator Acknowledgements */
      const char* const EXHAUST_FAN_ACK_DYN PROGMEM = "ACK:EXHAUST_FAN:";
      const char* const WATER_PUMP_ACK_DYN PROGMEM = "ACK:WATER_PUMP:";
    }
  }
}

#endif
