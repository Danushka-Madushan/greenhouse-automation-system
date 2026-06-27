namespace uart_com.Constants
{
  public static class GreenOS
  {
    public static class Events
    {
      public static class Incoming
      {
        public const string TEMP_HUMIDITY_DATA_DYN = "STATUS:TEMP_HUMIDITY:";
        public const string ERROR_DHT22_MSG_DYN = "ERR:SENSOR_DH22:";

        public const string GREENHOUSE_UNO = "SYS:GREENHOUSE_UNO";

        /* FromWebUI */
        public const string SYS_IS_ONLINE = "SYS:IS_ONLINE";
      }

      public static class Emit
      {
        public const string WHOAMI = "SYS:WHOAMI\n";

        /* ToWebUI */
        public const string SYS_ONLINE = "SYS:ONLINE";
        public const string SYS_OFFLINE = "SYS:OFFLINE";
        
      }
    }
  }
}
