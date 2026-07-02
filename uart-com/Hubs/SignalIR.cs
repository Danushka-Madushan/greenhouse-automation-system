using Microsoft.AspNetCore.SignalR;
using uart_com.Constants;
using uart_com.Services;

namespace uart_com.Hubs;

public class SignalIR(
  ILogger<SignalIR> logger,
  GreenhouseState greenhouseState,
  IHardwareCommandBridge hardwareCommandBridge
) : Hub
{
  private readonly ILogger<SignalIR> _logger = logger;
  private readonly GreenhouseState _greenhouseState = greenhouseState;
  private readonly IHardwareCommandBridge _hardwareCommandBridge = hardwareCommandBridge;
  private const int WaterPumpMinSeconds = 3;
  private const int WaterPumpMaxSeconds = 6;

  /* This method is called by the React Web UI to send a command to the Arduino */
  public async Task SendCommandToArduino(string command)
  {
    if (string.IsNullOrWhiteSpace(command))
    {
      _logger.LogWarning("Received empty command from WebUI. Ignoring.");
      await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, "ACK:GATEWAY:IGNORED:EMPTY_COMMAND");
      return;
    }

    _logger.LogInformation($"Received command from WebUI: {command}");

    string commandWithTerminator = command.EndsWith('\n') ? command : $"{command}\n";
    bool queued = _hardwareCommandBridge.TryQueueCommand(commandWithTerminator);

    string ack = queued
      ? $"ACK:GATEWAY:QUEUED:{command.Trim()}"
      : $"ACK:GATEWAY:FAILED:{command.Trim()}";

    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  public async Task TurnExhaustFanOn()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.TURN_EXHAUST_FAN_ON);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:EXHAUST_FAN:ON" : "ACK:GATEWAY:FAILED:CMD:EXHAUST_FAN:ON";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  public async Task TurnExhaustFanOff()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.TURN_EXHAUST_FAN_OFF);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:EXHAUST_FAN:OFF" : "ACK:GATEWAY:FAILED:CMD:EXHAUST_FAN:OFF";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  public async Task RunWaterPump(int seconds)
  {
    if (seconds < WaterPumpMinSeconds || seconds > WaterPumpMaxSeconds)
    {
      await Clients.Caller.SendAsync(
        GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED,
        $"ACK:GATEWAY:REJECTED:WATER_PUMP_SECONDS_OUT_OF_RANGE:{WaterPumpMinSeconds}-{WaterPumpMaxSeconds}"
      );
      return;
    }

    string command = $"{GreenOS.Events.Emit.Ardiono.RUN_WATER_PUMP_SECONDS_DYN}{seconds}\n";
    bool queued = _hardwareCommandBridge.TryQueueCommand(command);
    string ack = queued
      ? $"ACK:GATEWAY:QUEUED:CMD:WATER_PUMP:RUN_SECONDS:{seconds}"
      : $"ACK:GATEWAY:FAILED:CMD:WATER_PUMP:RUN_SECONDS:{seconds}";

    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
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

    string fanStatus = _greenhouseState.IsExhaustFanOn
      ? $"{GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_STATUS_DYN}ON"
      : $"{GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_STATUS_DYN}OFF";

    string pumpStatus = _greenhouseState.IsWaterPumpRunning
      ? $"{GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN}RUNNING:{_greenhouseState.WaterPumpRemainingSeconds}"
      : $"{GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN}OFF";

    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_EXHAUST_FAN, fanStatus);
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_WATER_PUMP, pumpStatus);

    await base.OnConnectedAsync();
  }

  public override Task OnDisconnectedAsync(Exception? exception)
  {
    _logger.LogInformation($"Web UI Disconnected: {Context.ConnectionId}");
    return base.OnDisconnectedAsync(exception);
  }
}
