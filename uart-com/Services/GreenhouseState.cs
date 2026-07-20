namespace uart_com.Services;

public enum OperatingMode
{
  Manual,
  Auto
}

public class GreenhouseState
{
  public bool IsBoardOnline { get; set; } = false;
  public bool IsExhaustFanOn { get; set; } = false;
  public bool IsWaterPumpRunning { get; set; } = false;
  public bool IsRefillPumpRunning { get; set; } = false;
  public OperatingMode CurrentMode { get; set; } = OperatingMode.Manual;
  public DateTime? WaterPumpRunUntilUtc { get; set; }

  public int WaterPumpRemainingSeconds
  {
    get
    {
      if (!WaterPumpRunUntilUtc.HasValue || !IsWaterPumpRunning)
      {
        return 0;
      }

      var remaining = WaterPumpRunUntilUtc.Value - DateTime.UtcNow;
      return remaining.TotalSeconds > 0 ? (int)Math.Ceiling(remaining.TotalSeconds) : 0;
    }
  }
}
