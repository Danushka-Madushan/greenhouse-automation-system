namespace uart_com.Constants
{
  public static class GreenOS
  {
    public static class Events
    {
      public static class Incoming
      {
        public static class Ardiono
        {
          /* Sensor Updates */
          public const string TEMP_HUMIDITY_DATA_DYN = "STATUS:TEMP_HUMIDITY:";
          /* Sensor Errors */
          public const string ERROR_DHT22_MSG_DYN = "ERR:SENSOR_DH22:";
          /* Light Intensity Data */
          public const string LIGHT_INTENSITY_DATA_DYN = "STATUS:LIGHT_INTENSITY:";
          /* Water Level Data */
          public const string WATER_LEVEL_DATA_DYN = "STATUS:WATER_LEVEL:";
          /* Soil Moisture Data */
          public const string SOIL_MOISTURE_DATA_DYN = "STATUS:SOIL_MOISTURE:";

          /* Actuator Status Updates */
          public const string EXHAUST_FAN_STATUS_DYN = "STATUS:EXHAUST_FAN:";
          public const string WATER_PUMP_STATUS_DYN = "STATUS:WATER_PUMP:";
          public const string REFILL_PUMP_STATUS_DYN = "STATUS:REFILL_PUMP:";
          public const string MODE_STATUS_DYN = "STATUS:MODE:";

          /* Actuator Acknowledgements */
          public const string EXHAUST_FAN_ACK_DYN = "ACK:EXHAUST_FAN:";
          public const string WATER_PUMP_ACK_DYN = "ACK:WATER_PUMP:";
          public const string REFILL_PUMP_ACK_DYN = "ACK:REFILL_PUMP:";
          public const string MODE_ACK_DYN = "ACK:MODE:";

          /* System Check */
          public const string GREENHOUSE_UNO = "SYS:GREENHOUSE_UNO";
        }

        public static class WebUI
        {

        }
      }

      public static class Emit
      {
        public static class Ardiono
        {
          /* System Check */
          public const string WHOAMI = "SYS:WHOAMI\n";

          /* Actuator Commands */
          public const string TURN_EXHAUST_FAN_ON = "CMD:EXHAUST_FAN:ON\n";
          public const string TURN_EXHAUST_FAN_OFF = "CMD:EXHAUST_FAN:OFF\n";
          public const string RUN_WATER_PUMP_SECONDS_DYN = "CMD:WATER_PUMP:RUN_SECONDS:";

          /* Refill Pump Commands */
          public const string REFILL_PUMP_ON = "CMD:REFILL_PUMP:ON\n";
          public const string REFILL_PUMP_OFF = "CMD:REFILL_PUMP:OFF\n";

          /* Operating Mode Commands */
          public const string SET_MODE_AUTO = "CMD:MODE:AUTO\n";
          public const string SET_MODE_MANUAL = "CMD:MODE:MANUAL\n";
        }

        public static class WebUI
        {
          /* ToWebUI */
          public const string SYS_ONLINE = "SYS:ONLINE";
          public const string SYS_OFFLINE = "SYS:OFFLINE";

          /* Sensor Updates */
          public const string UPDATE_TEMP_HUMIDITY = "onSensorUpdate:TEMP_HUMIDITY";
          public const string UPDATE_LIGHT_INTENSITY = "onSensorUpdate:LIGHT_INTENSITY";
          /* Sensor Errors */
          public const string TEMP_HUMIDITY_ERROR = "onSensorError:TEMP_HUMIDITY";
          /* Water Level Data */
          public const string UPDATE_WATER_LEVEL = "onSensorUpdate:WATER_LEVEL";
          /* Soil Moisture Data */
          public const string UPDATE_SOIL_MOISTURE = "onSensorUpdate:SOIL_MOISTURE";

          /* Actuator Updates */
          public const string UPDATE_EXHAUST_FAN = "onActuatorUpdate:EXHAUST_FAN";
          public const string UPDATE_WATER_PUMP = "onActuatorUpdate:WATER_PUMP";
          public const string UPDATE_REFILL_PUMP = "onActuatorUpdate:REFILL_PUMP";
          public const string UPDATE_MODE = "onModeUpdate";

          /* Actuator Acknowledgements */
          public const string ACK_EXHAUST_FAN = "onActuatorAck:EXHAUST_FAN";
          public const string ACK_WATER_PUMP = "onActuatorAck:WATER_PUMP";
          public const string ACK_REFILL_PUMP = "onActuatorAck:REFILL_PUMP";
          public const string ACK_MODE = "onModeAck";

          /* Generic Command Ack */
          public const string COMMAND_ACKNOWLEDGED = "CommandAcknowledged";
        }

      }
    }
  }
}
