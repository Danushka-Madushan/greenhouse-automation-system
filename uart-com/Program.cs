using uart_com.Services;
using uart_com.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSignalR();

/* Add CORS so the React Dev Server (Vite) can communicate with this API */
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowReactDevClient", policy =>
  {
    policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for SignalR WebSockets
  });
});

/* Register our Hardware Worker as a background hosted service */
builder.Services.AddHostedService<HardwareWorker>();
builder.Services.AddSingleton<GreenhouseState>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  // Use CORS only in development
  app.UseCors("AllowReactDevClient");
}
else
{
  // In Production, serve the compiled React app from wwwroot
  app.UseDefaultFiles();
  app.UseStaticFiles();
}

/* Health Check */
app.MapGet("/", () => "Greenhouse IoT Gateway is running.");

app.MapHub<SignalIR>("/greenos");

// 6. Map Fallback for React Router (Only if wwwroot exists)
if (Directory.Exists(Path.Combine(builder.Environment.ContentRootPath, "wwwroot")))
{
  app.MapFallbackToFile("index.html");
}

app.Run();
