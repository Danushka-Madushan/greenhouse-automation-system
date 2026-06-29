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
        }

      }
    }
  }
}
