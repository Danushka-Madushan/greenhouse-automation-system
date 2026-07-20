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

  /* This method is called by the React Web UI to send a raw command to the Arduino */
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

  /* ── Exhaust Fan ────────────────────────────────────── */

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

  /* ── Water Pump ─────────────────────────────────────── */

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

  /* ── Refill Pump ────────────────────────────────────── */

  public async Task TurnRefillPumpOn()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.REFILL_PUMP_ON);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:REFILL_PUMP:ON" : "ACK:GATEWAY:FAILED:CMD:REFILL_PUMP:ON";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  public async Task TurnRefillPumpOff()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.REFILL_PUMP_OFF);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:REFILL_PUMP:OFF" : "ACK:GATEWAY:FAILED:CMD:REFILL_PUMP:OFF";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  /* ── Operating Mode ─────────────────────────────────── */

  public async Task SetAutoMode()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.SET_MODE_AUTO);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:MODE:AUTO" : "ACK:GATEWAY:FAILED:CMD:MODE:AUTO";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  public async Task SetManualMode()
  {
    bool queued = _hardwareCommandBridge.TryQueueCommand(GreenOS.Events.Emit.Ardiono.SET_MODE_MANUAL);
    string ack = queued ? "ACK:GATEWAY:QUEUED:CMD:MODE:MANUAL" : "ACK:GATEWAY:FAILED:CMD:MODE:MANUAL";
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, ack);
  }

  /* ── Connection Lifecycle ───────────────────────────── */

  public override async Task OnConnectedAsync()
  {
    _logger.LogInformation($"Web UI Connected: {Context.ConnectionId}");

    /* Instantly inform the new client about system online/offline state */
    string initialStatusEvent = _greenhouseState.IsBoardOnline
        ? GreenOS.Events.Emit.WebUI.SYS_ONLINE
        : GreenOS.Events.Emit.WebUI.SYS_OFFLINE;

    await Clients.Caller.SendAsync(initialStatusEvent);

    /* Sync full actuator and mode snapshot */
    string fanStatus = _greenhouseState.IsExhaustFanOn
      ? $"{GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_STATUS_DYN}ON"
      : $"{GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_STATUS_DYN}OFF";

    string pumpStatus = _greenhouseState.IsWaterPumpRunning
      ? $"{GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN}RUNNING:{_greenhouseState.WaterPumpRemainingSeconds}"
      : $"{GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN}OFF";

    string refillStatus = _greenhouseState.IsRefillPumpRunning
      ? $"{GreenOS.Events.Incoming.Ardiono.REFILL_PUMP_STATUS_DYN}ON"
      : $"{GreenOS.Events.Incoming.Ardiono.REFILL_PUMP_STATUS_DYN}OFF";

    string modeStatus = _greenhouseState.CurrentMode == OperatingMode.Auto
      ? $"{GreenOS.Events.Incoming.Ardiono.MODE_STATUS_DYN}AUTO"
      : $"{GreenOS.Events.Incoming.Ardiono.MODE_STATUS_DYN}MANUAL";

    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_EXHAUST_FAN, fanStatus);
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_WATER_PUMP, pumpStatus);
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_REFILL_PUMP, refillStatus);
    await Clients.Caller.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_MODE, modeStatus);

    await base.OnConnectedAsync();
  }

  public override Task OnDisconnectedAsync(Exception? exception)
  {
    _logger.LogInformation($"Web UI Disconnected: {Context.ConnectionId}");
    return base.OnDisconnectedAsync(exception);
  }
}
