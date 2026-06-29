using System.IO.Ports;
using Microsoft.AspNetCore.SignalR;
using uart_com.Constants;
using uart_com.Hubs;

namespace uart_com.Services;

public class HardwareWorker(
    ILogger<HardwareWorker> logger,
    IHubContext<SignalIR> hubContext,
    GreenhouseState greenhouseState
    ) : BackgroundService
{
    private readonly ILogger<HardwareWorker> _logger = logger;
    private readonly IHubContext<SignalIR> _hubContext = hubContext;
    private readonly GreenhouseState _greenhouseState = greenhouseState;
    private SerialPort? _serialPort;
    private bool _isConnected = false;

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
        /* Increase timeout for standard operations. If the Arduino is quiet for 5 seconds,
         * it throws a controlled timeout, allowing us to check for app shutdown requests.
         */
        _serialPort!.ReadTimeout = 5000;

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

    public override void Dispose()
    {
        _serialPort?.Dispose();
        base.Dispose();
    }
}
