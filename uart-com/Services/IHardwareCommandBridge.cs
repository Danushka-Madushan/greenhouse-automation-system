namespace uart_com.Services;

public interface IHardwareCommandBridge
{
  bool TryQueueCommand(string command);
}
