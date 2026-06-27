import * as signalR from "@microsoft/signalr";

/* In Vite, import.meta.env.DEV is true when running 'npm run dev' */
const HUB_URL = import.meta.env.DEV ? "http://localhost:5188/greenos" : "/greenos";

class SignalRService {
  public connection: signalR.HubConnection;

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  public async startConnection() {
    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.start();
        console.log("SignalR Connected to C# Gateway.");
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
        setTimeout(() => this.startConnection(), 5000);
      }
    }
  }

  // Emit a command from React to C#
  public async sendArduinoCommand(command: string) {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke("SendCommandToArduino", command);
      } catch (err) {
        console.error("Error sending command:", err);
      }
    } else {
      console.warn("Cannot send command, SignalR is disconnected.");
    }
  }
}

export const signalRService = new SignalRService();
