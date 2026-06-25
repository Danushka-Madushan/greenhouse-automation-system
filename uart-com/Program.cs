using uart_com.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

// 1. Register our Hardware Worker as a background hosted service
builder.Services.AddHostedService<HardwareWorker>();

var app = builder.Build();

app.UseHttpsRedirection();

// 2. Simple health check route just to verify the web server is alive
app.MapGet("/", () => "Greenhouse IoT Gateway is running.");

app.Run();
