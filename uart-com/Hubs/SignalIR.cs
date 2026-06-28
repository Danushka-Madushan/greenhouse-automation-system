using Microsoft.AspNetCore.SignalR;
using uart_com.Constants;
using uart_com.Services;

namespace uart_com.Hubs;

public class SignalIR(ILogger<SignalIR> logger, GreenhouseState greenhouseState) : Hub
{
  private readonly ILogger<SignalIR> _logger = logger;
  private readonly GreenhouseState _greenhouseState = greenhouseState; // Inject state service

  /* This method is called by the React Web UI to send a command to the Arduino */
  public async Task SendCommandToArduino(string command)
  {
    if (string.IsNullOrWhiteSpace(command))
    {
      _logger.LogWarning("Received empty command from WebUI. Ignoring.");
      return;
    }

    _logger.LogInformation($"Received command from WebUI: {command}");

    /* Future integration: Pass to HardwareWorker... */

    /* For now, let's just echo back a confirmation to the UI */
    await Clients.All.SendAsync("CommandAcknowledged", $"C# received: {command}");
  }

  // FIX 4: Automated Initial Synchronization for late joiners
  public override async Task OnConnectedAsync()
  {
    _logger.LogInformation($"Web UI Connected: {Context.ConnectionId}");

    // As soon as a client connects, instantly inform them if the system is online or offline
    string initialStatusEvent = _greenhouseState.IsBoardOnline
        ? GreenOS.Events.Emit.WebUI.SYS_ONLINE
        : GreenOS.Events.Emit.WebUI.SYS_OFFLINE;

    await Clients.Caller.SendAsync(initialStatusEvent);

    await base.OnConnectedAsync();
  }

  public override Task OnDisconnectedAsync(Exception? exception)
  {
    _logger.LogInformation($"Web UI Disconnected: {Context.ConnectionId}");
    return base.OnDisconnectedAsync(exception);
  }
}
