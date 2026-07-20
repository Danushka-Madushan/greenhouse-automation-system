using System.IO.Ports;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using uart_com.Constants;
using uart_com.Hubs;

namespace uart_com.Services;

public class HardwareWorker(
    ILogger<HardwareWorker> logger,
    IHubContext<SignalIR> hubContext,
    GreenhouseState greenhouseState
    ) : BackgroundService, IHardwareCommandBridge
{
    private readonly ILogger<HardwareWorker> _logger = logger;
    private readonly IHubContext<SignalIR> _hubContext = hubContext;
    private readonly GreenhouseState _greenhouseState = greenhouseState;
    private SerialPort? _serialPort;
    private bool _isConnected = false;
    private readonly ConcurrentQueue<string> _pendingCommands = new();

    /* Baud Rate */
    private const int BaudRate = 9600;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Hardware Worker started. Waiting for Microcontroller...");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!_isConnected || _serialPort == null || !_serialPort.IsOpen)
            {
                if (_greenhouseState.IsBoardOnline)
                {
                    _greenhouseState.IsBoardOnline = false;
                    await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.SYS_OFFLINE, cancellationToken: stoppingToken);
                }

                _isConnected = await TryDiscoverArduinoAsync(stoppingToken);

                if (!_isConnected)
                {
                    /* If no Arduino is found, wait 5 seconds before scanning again to save CPU */
                    await Task.Delay(5000, stoppingToken);
                    continue;
                }
            }

            /* We are connected. Enter the main listening loop. */
            try
            {
                _greenhouseState.IsBoardOnline = true;
                await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.SYS_ONLINE, cancellationToken: stoppingToken);
                await BroadcastActuatorSnapshotAsync(stoppingToken);
                
                await ReadDataLoopAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Connection lost or disrupted: {ex.Message}. Restarting discovery...");
                _isConnected = false;

                if (_greenhouseState.IsBoardOnline)
                {
                    _greenhouseState.IsBoardOnline = false;
                    await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.SYS_OFFLINE, cancellationToken: stoppingToken);
                }

                _serialPort?.Dispose();
                _serialPort = null;
            }
        }
    }

    private async Task<bool> TryDiscoverArduinoAsync(CancellationToken stoppingToken)
    {
        string[] ports = SerialPort.GetPortNames();

        if (ports.Length == 0)
        {
            _logger.LogDebug("No COM ports detected on this machine.");
            return false;
        }

        foreach (string port in ports)
        {
            if (stoppingToken.IsCancellationRequested) return false;

            _logger.LogInformation($"Pinging port {port}...");

            SerialPort? testPort = null;
            bool claimedPort = false;

            try
            {
                testPort = new SerialPort(port, BaudRate)
                {
                    ReadTimeout = 2000,
                    WriteTimeout = 1000,
                    NewLine = "\n"
                };

                testPort.Open();

                /* On the Arduino Uno, SerialPort.Open() pulses the DTR pin, which is
                 * wired to the Uno's hardware reset line. This triggers a full board
                 * reset — the bootloader runs for ~1-2 seconds before the sketch starts.
                 * Sending WHOAMI before the sketch is ready means it lands in the
                 * bootloader, which ignores it entirely.
                 * We wait here to let the bootloader finish and the sketch take over.
                 */
                await Task.Delay(2000, stoppingToken);

                /* Discard AFTER the boot wait — the bootloader may have emitted
                 * data during reset that would otherwise corrupt our handshake read.
                 */
                testPort.DiscardInBuffer();

                testPort.Write(GreenOS.Events.Emit.Ardiono.WHOAMI);

                /* Give the sketch a brief moment to process and form its reply */
                await Task.Delay(100, stoppingToken);

                string response = testPort.ReadLine().Trim();

                if (response.Contains(GreenOS.Events.Incoming.Ardiono.GREENHOUSE_UNO))
                {
                    _logger.LogInformation($"SUCCESS! Greenhouse Arduino locked on {port}.");
                    _serialPort = testPort;
                    claimedPort = true;
                    return true;
                }

                _logger.LogDebug($"Port {port} responded with unknown data: {response}");
            }
            catch (TimeoutException)
            {
                _logger.LogDebug($"Port {port} timed out. Not our device.");
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogDebug($"Port {port} is currently locked by another application.");
            }
            catch (Exception ex)
            {
                _logger.LogDebug($"Error testing port {port}: {ex.Message}");
            }
            finally
            {
                /* Always release ports we aren't keeping, regardless of which
                 * path above exited. Previously, TimeoutException and the wrong-
                 * response branch both left testPort open and undisposed.
                 */
                if (!claimedPort)
                {
                    testPort?.Close();
                    testPort?.Dispose();
                }
            }
        }

        return false;
    }

    private async Task ReadDataLoopAsync(CancellationToken stoppingToken)
    {
        /* Use a short timeout so command queue writes are drained quickly even when
         * the Arduino does not emit sensor lines for a moment.
         */
        _serialPort!.ReadTimeout = 500;

        /* ReadLine() is a synchronous blocking call — it has no knowledge of CancellationToken.
         * Without this registration, Ctrl+C fires but ReadLine() holds the thread for up to
         * the full ReadTimeout (5 s) before the while-loop condition can even be evaluated.
         * Closing the port immediately unblocks ReadLine(), which throws IOException — caught
         * below and converted into a clean break.
         */
        using var shutdownRegistration = stoppingToken.Register(() => _serialPort?.Close());

        while (!stoppingToken.IsCancellationRequested && _serialPort.IsOpen)
        {
            try
            {
                await DrainPendingCommandsAsync(stoppingToken);

                string line = _serialPort.ReadLine().Trim();

                if (!string.IsNullOrEmpty(line))
                {
                    _logger.LogInformation($"[{DateTime.Now:HH:mm:ss}] [ARDUINO TX] {line}");

                    if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.TEMP_HUMIDITY_DATA_DYN))
                    {
                        /* Example: "STATUS:TEMP_HUMIDITY:24.5,60.2" */
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_TEMP_HUMIDITY, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.ERROR_DHT22_MSG_DYN))
                    {
                        /* Example: "ERR:SENSOR_DH22:READ_FAIL" */
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.TEMP_HUMIDITY_ERROR, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.LIGHT_INTENSITY_DATA_DYN))
                    {
                        /* Example: "STATUS:LIGHT_INTENSITY:75.3" */
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_LIGHT_INTENSITY, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.WATER_LEVEL_DATA_DYN))
                    {
                        /* Example: "STATUS:WATER_LEVEL:85.0" */
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_WATER_LEVEL, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.SOIL_MOISTURE_DATA_DYN))
                    {
                        /* Example: "STATUS:SOIL_MOISTURE:65" */
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_SOIL_MOISTURE, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_STATUS_DYN))
                    {
                        _greenhouseState.IsExhaustFanOn = line.EndsWith("ON", StringComparison.OrdinalIgnoreCase);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_EXHAUST_FAN, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN))
                    {
                        string status = line[GreenOS.Events.Incoming.Ardiono.WATER_PUMP_STATUS_DYN.Length..].Trim();
                        _greenhouseState.IsWaterPumpRunning = status.StartsWith("RUNNING", StringComparison.OrdinalIgnoreCase);

                        if (_greenhouseState.IsWaterPumpRunning)
                        {
                            var parts = status.Split(':');
                            if (parts.Length >= 2 && int.TryParse(parts[1], out int remainingSeconds) && remainingSeconds > 0)
                            {
                                _greenhouseState.WaterPumpRunUntilUtc = DateTime.UtcNow.AddSeconds(remainingSeconds);
                            }
                        }
                        else
                        {
                            _greenhouseState.WaterPumpRunUntilUtc = null;
                        }

                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_WATER_PUMP, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.EXHAUST_FAN_ACK_DYN))
                    {
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.ACK_EXHAUST_FAN, line, cancellationToken: stoppingToken);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.WATER_PUMP_ACK_DYN))
                    {
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.ACK_WATER_PUMP, line, cancellationToken: stoppingToken);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.REFILL_PUMP_STATUS_DYN))
                    {
                        _greenhouseState.IsRefillPumpRunning = line.EndsWith("ON", StringComparison.OrdinalIgnoreCase);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_REFILL_PUMP, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.REFILL_PUMP_ACK_DYN))
                    {
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.ACK_REFILL_PUMP, line, cancellationToken: stoppingToken);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.MODE_STATUS_DYN))
                    {
                        string modeStr = line[GreenOS.Events.Incoming.Ardiono.MODE_STATUS_DYN.Length..].Trim();
                        _greenhouseState.CurrentMode = modeStr.Equals("AUTO", StringComparison.OrdinalIgnoreCase)
                            ? OperatingMode.Auto
                            : OperatingMode.Manual;
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_MODE, line, cancellationToken: stoppingToken);
                    }
                    else if (line.StartsWith(GreenOS.Events.Incoming.Ardiono.MODE_ACK_DYN))
                    {
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.ACK_MODE, line, cancellationToken: stoppingToken);
                        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.COMMAND_ACKNOWLEDGED, line, cancellationToken: stoppingToken);
                    }
                }
            }
            catch (TimeoutException)
            {
                /* Normal — the Arduino just hasn't sent data recently.
                 * Yield briefly, then loop to re-check the cancellation token.
                 */
                await Task.Delay(10, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                /* stoppingToken was cancelled during Task.Delay above — exit cleanly. */
                break;
            }
            catch (IOException) when (stoppingToken.IsCancellationRequested)
            {
                /* The shutdown registration closed the port, unblocking ReadLine().
                 * This is an intentional teardown, not a real connection failure.
                 */
                break;
            }
        }
    }

    public bool TryQueueCommand(string command)
    {
        if (string.IsNullOrWhiteSpace(command))
        {
            return false;
        }

        _pendingCommands.Enqueue(command);
        return true;
    }

    private async Task DrainPendingCommandsAsync(CancellationToken stoppingToken)
    {
        if (_serialPort == null || !_serialPort.IsOpen)
        {
            return;
        }

        while (_pendingCommands.TryDequeue(out string? command))
        {
            try
            {
                _serialPort.Write(command);
                _logger.LogInformation($"[{DateTime.Now:HH:mm:ss}] [C# -> ARDUINO] {command.Trim()}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to send queued command '{command.Trim()}': {ex.Message}");
                _pendingCommands.Enqueue(command);
                await Task.Delay(100, stoppingToken);
                break;
            }
        }
    }

    public async Task BroadcastActuatorSnapshotAsync(CancellationToken cancellationToken)
    {
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

        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_EXHAUST_FAN, fanStatus, cancellationToken: cancellationToken);
        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_WATER_PUMP, pumpStatus, cancellationToken: cancellationToken);
        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_REFILL_PUMP, refillStatus, cancellationToken: cancellationToken);
        await _hubContext.Clients.All.SendAsync(GreenOS.Events.Emit.WebUI.UPDATE_MODE, modeStatus, cancellationToken: cancellationToken);
    }

    public override void Dispose()
    {
        _serialPort?.Dispose();
        base.Dispose();
    }
}
