<div align="center">

<img src="https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/refs/heads/main/webui/public/favicon.svg" width="80" height="80" alt="GreenOS Logo" />

# GreenOS — Greenhouse Automation System

An affordable, Arduino-powered greenhouse automation solution with real-time remote monitoring, intelligent autonomous control, and cloud analytics.

[![Platform](https://img.shields.io/badge/Platform-Arduino%20Uno%20R3-00979D?style=flat-square&logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Backend](https://img.shields.io/badge/Backend-.NET%2010-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-3945ed?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Analytics-Firebase%20RTDB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Institution](https://img.shields.io/badge/NIBM-HND--SE%20%7C%20Batch%2026.1F-0F6E56?style=flat-square)](https://www.nibm.lk/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Dashboard Preview](#-dashboard-preview)
- [Key Features](#-key-features)
- [Autonomous Mode Logic](#-autonomous-mode-logic)
- [System Architecture](#️-system-architecture)
- [Communication Protocol](#-communication-protocol)
- [System Design](#️-system-design)
- [Hardware Specifications](#-hardware-specifications-bom)
- [Software Stack](#-software-stack)
- [Getting Started](#-getting-started)

---

## 🌿 Overview

Greenhouse farming — a form of **Controlled Environment Agriculture (CEA)** — demands precise control over temperature, humidity, light, and irrigation to maximize crop yields. Conventional automation solutions rely on expensive industrial equipment that puts remote monitoring out of reach for small-scale farmers.

**GreenOS** is a **low-cost, remotely-operable greenhouse automation system** built around an Arduino Uno R3. It delivers:

- **Fully autonomous closed-loop control** — the Arduino manages all actuators independently, even without a PC or web UI connected.
- **Real-time remote monitoring** — a React web dashboard streams live sensor data via .NET SignalR.
- **Cloud analytics** — photosynthesis efficiency snapshots are logged to Firebase Realtime Database every 10 seconds.
- **Dual operating modes** — Manual mode for hands-on demonstration; Auto mode for unattended, intelligent operation.

All of this for under **Rs. 5,000** in hardware.

---

## 🖥️ Dashboard Preview

![GreenOS Web Dashboard](https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/refs/heads/main/docs/webui.png)

The live dashboard shows real-time readings for Water Tank level, Atmosphere (Temp + Humidity), Photosynthesis efficiency, and 4-zone Soil Moisture — all updating live without page refresh.

---

## 🌟 Key Features

### 🤖 Manual & Autonomous Operating Modes

The system operates in two distinct modes, switchable from the web dashboard:

| Mode | Behaviour |
|:---|:---|
| **MANUAL** (default on boot) | All actuators are controlled exclusively by the operator via the web UI. Safe for demonstrations — nothing fires on power-up. |
| **AUTO** | The Arduino independently manages all actuators based on live sensor readings. Switching back to Manual immediately cancels any auto-triggered operation. |

A **5-second cooldown** is enforced between mode switches to allow the Arduino to settle, displayed as a live countdown badge in the UI.

---

### 🌱 Multi-Zone Soil Moisture Monitoring

- Monitors soil moisture independently across **4 distinct greenhouse sectors** (NW, NE, SW, SE) via capacitive sensors.
- Computes a weighted average across all zones to assess overall rootzone water levels.
- Displays a per-sector breakdown on the dashboard with individual health indicators.
- In **AUTO mode**, automatically triggers the irrigation pump when the average moisture falls below **30%**.

---

### 💧 Smart Irrigation System

- In Manual mode: activate the water pump for a user-specified duration (seconds) from the dashboard.
- In Auto mode:
  - Fires the water pump for a **3-second burst** when soil moisture is below threshold.
  - A **60-second cooldown** prevents rapid re-triggering, giving the soil time to absorb water before re-evaluating.
  - **Tank-priority safety**: If the water tank level is below 20% OR the refill pump is actively running, irrigation is **blocked** — the system fills the tank first, preventing the pump from running dry.

---

### 🌡️ Temperature & Humidity Climate Control

- Continuously measures internal greenhouse air temperature and humidity using the **DHT22 sensor** (sampled every 2 seconds).
- Calculates derived metrics: **Feels Like** temperature and **Dew Point**.
- In **AUTO mode**:
  - Fan turns **ON** if temperature > **32°C** OR humidity > **80%** (either condition alone is sufficient).
  - Fan turns **OFF** only when temperature drops below **28°C** AND humidity drops below **70%** (hysteresis prevents rapid cycling).
  - A **30-second cooldown** guards against rapid fan toggling.

---

### ☀️ Photosynthesis Efficiency Monitoring

- Detects ambient light levels using an **LDR analog sensor** (sampled every second).
- Computes a real-time **Greenhouse Efficiency %** — a combined score factoring in light, temperature, and humidity relative to optimal crop growth conditions.
- Displays a sun animation that dynamically reflects current light intensity.
- Streams data labeled as PAR (Photosynthetically Active Radiation) proxy readings.

---

### 💧 Water Tank Level Monitoring & Auto-Refill

- Uses the **HC-SR04 ultrasonic sensor** for non-contact, continuous water level measurement.
- Displays a live animated water tank graphic showing fill level with percentage and estimated volume.
- In **AUTO mode**:
  - Refill pump activates when tank drops below **20%**.
  - Refill pump deactivates when tank reaches **80%** (hysteresis band prevents overfilling).
- In **Manual mode**: Refill pump can be toggled directly from the dashboard.

---

### 📊 Cloud Analytics (Firebase)

- Logs an **EfficiencySnapshot** to Firebase Realtime Database every **10 seconds** while the web UI is online.
- Snapshots include: timestamp, efficiency %, light level, temperature, humidity, moisture, and water level.
- **Manual "Sync Now" button** on the Analytics tab to force an immediate cloud sync on demand.
- Three analytics views available in the dashboard:
  - **Live Graph** — real-time efficiency line chart for the current session.
  - **Date Compare** — compare efficiency line charts between any two historical dates side-by-side.
  - **Weekly Report** — bar chart of average daily efficiency for the past 7 days, colour-coded by performance tier.
- **AI Recommendation Engine** — rule-based analysis of current sensor readings generates actionable crop efficiency recommendations displayed as cards.

---

### 🛡️ Safe Power-Up Defaults

- On power-up, the Arduino boots in **MANUAL mode** — no actuators fire regardless of sensor readings.
- All relay pins are initialised **HIGH (OFF)** before being set to OUTPUT mode, preventing the common "glitch pulse" that can momentarily trigger relays during microcontroller boot.
- Active-LOW relay module wiring is handled transparently by the `AutomationController`.

---

### 🔌 Resilient Serial Protocol

The Arduino communicates via a lightweight string-based UART protocol:

- **Commands in** (C# → Arduino): `CMD:EXHAUST_FAN:ON`, `CMD:WATER_PUMP:RUN_SECONDS:5`, `CMD:MODE:AUTO`, etc.
- **Status out** (Arduino → C#): `STATUS:TEMP_HUMIDITY:24.0,40.5`, `STATUS:WATER_LEVEL:63.2`, `STATUS:MODE:AUTO`, etc.
- **Acknowledgements**: Every command receives an `ACK:` response confirming execution or failure.
- The C# gateway auto-discovers the correct Arduino COM port on startup.

---

## 🤖 Autonomous Mode Logic

Complete decision table for AUTO mode (evaluated every Arduino `loop()` cycle, ~500ms):

| Sensor Condition | Action | Guard |
|:---|:---|:---|
| Moisture < 30% AND Tank ≥ 20% AND Refill pump OFF | Water pump ON (3-second burst) | 60s cooldown between bursts |
| Moisture < 30% AND (Tank < 20% OR Refill pump ON) | **Water pump BLOCKED** — tank fills first | — |
| Tank < 20% | Refill pump ON | — |
| Tank ≥ 80% | Refill pump OFF | — |
| Temp > 32°C **OR** Humidity > 80% | Exhaust fan ON | 30s cooldown |
| Temp ≤ 28°C **AND** Humidity ≤ 70% | Exhaust fan OFF (hysteresis) | 30s cooldown |
| Switch to MANUAL | All AUTO-triggered actuators immediately cancelled | — |

---

## 🏗️ System Architecture

The system follows a **Decoupled Gateway Architecture**, isolating hardware-level polling from web communication logic. The Arduino is the single source of truth for all actuator state.

![Block Diagram](https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/d42b4329a816e44b1e8fc3f3256965057ed9d206/docs/block_diagram.svg)

### Three-Layer Design

| Layer | Technology | Responsibility |
|:---|:---|:---|
| **Hardware** | Arduino Uno R3 + GreenOS library | Sensor polling, autonomous control, relay switching |
| **Bridge** | .NET 10 + ASP.NET SignalR | UART ↔ WebSocket translation, COM port discovery |
| **Dashboard** | React + Vite + Firebase | Live visualisation, manual commands, cloud analytics |

> **Key principle:** The Arduino operates fully autonomously — if the PC or web UI goes offline, the greenhouse continues to be managed correctly in AUTO mode.

### Data Flow

```
[Sensors] ──► [Arduino Uno R3 — GreenOS]
                    │  UART / USB (9600 baud)
                    ▼
             [.NET 10 Gateway — HardwareWorker]
                    │                  │
              [SignalR Hub]      [COM Discovery]
                    │
             [React Dashboard]
             [Firebase RTDB]
                    │
          [Manual Commands / Mode Switch]
                    │
             [.NET Gateway] ──UART──► [Arduino] ──► [4-CH Relay] ──► [Actuators]
```

---

## 📡 Communication Protocol

All Arduino ↔ C# communication uses newline-terminated ASCII strings over UART at **9600 baud**.

### Incoming Commands (C# → Arduino)

| Command | Description |
|:---|:---|
| `SYS:WHOAMI` | Device identity check |
| `CMD:MODE:AUTO` | Switch to autonomous mode |
| `CMD:MODE:MANUAL` | Switch to manual mode |
| `CMD:EXHAUST_FAN:ON` | Turn exhaust fan on |
| `CMD:EXHAUST_FAN:OFF` | Turn exhaust fan off |
| `CMD:WATER_PUMP:RUN_SECONDS:<n>` | Run irrigation pump for `n` seconds |
| `CMD:REFILL_PUMP:ON` | Turn refill pump on |
| `CMD:REFILL_PUMP:OFF` | Turn refill pump off |

### Outgoing Status (Arduino → C#)

| Message | Description |
|:---|:---|
| `STATUS:TEMP_HUMIDITY:<temp>,<hum>` | DHT22 reading |
| `STATUS:LIGHT_INTENSITY:<raw>` | LDR analog reading |
| `STATUS:WATER_LEVEL:<pct>` | Ultrasonic tank level % |
| `STATUS:SOIL_MOISTURE:<pct>` | Soil moisture % |
| `STATUS:EXHAUST_FAN:<ON\|OFF>` | Fan state |
| `STATUS:WATER_PUMP:<OFF\|RUNNING:0>` | Pump state |
| `STATUS:REFILL_PUMP:<ON\|OFF>` | Refill pump state |
| `STATUS:MODE:<AUTO\|MANUAL>` | Current operating mode |
| `ACK:MODE:<OK:AUTO\|OK:MANUAL>` | Mode switch confirmation |
| `ACK:EXHAUST_FAN:<OK:ON\|OK:OFF>` | Fan command confirmation |
| `ACK:WATER_PUMP:<OK:RUNNING\|INVALID_SECONDS>` | Pump command confirmation |
| `ACK:REFILL_PUMP:<OK:ON\|OK:OFF>` | Refill command confirmation |

---

## 🛠️ System Design

The physical layout connects sensors distributed across greenhouse zones to a centralized Arduino controller, with isolated power paths for logic and actuator circuits.

![System Design](https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/refs/heads/main/docs/system_design.svg)

### Power Strategy — Hardware Isolation

To ensure stability and protect the microcontroller from inductive spikes:

| Domain | Source | Regulation |
|:---|:---|:---|
| **Logic** (Arduino + Sensors) | PC USB (5V) | Native USB power |
| **Actuators** (Pumps + Fan) | 12V 2A DC Adapter | Stepped down to **5V** via LM2596S Buck Module |

> ⚠️ **Protection:** 1N4007 flyback diodes are placed across all motor terminals to suppress inductive voltage spikes from the pumps and fan.

---

## 📦 Hardware Specifications (BOM)

| Component | Qty | Purpose | Approx. Cost |
|:---|:---:|:---|---:|
| Arduino Uno R3 | 1 | Hardware Abstraction Layer (HAL) / Brain | — *(provided by NIBM)* |
| Capacitive Soil Moisture Sensor v1.2 | 1 | Substrate moisture monitoring | Rs. 220.00 |
| DHT22 / AM2302 Module | 1 | Air temperature & humidity sensing | Rs. 380.00 |
| HC-SR04 Ultrasonic Sensor | 1 | Non-contact water level measurement | Rs. 260.00 |
| LDR (Photoresistor) | 1 | Sunlight / photosynthesis proxy monitoring | Rs. 50.00 |
| 5V Mini Submersible Water Pump | 2 | Irrigation & autonomous reservoir refill | Rs. 430.00 |
| 5V 4-Channel Relay Module | 1 | High-current actuator switching | Rs. 560.00 |
| LM2596S Adjustable Buck Module | 1 | Isolated 5V actuator power regulation | Rs. 620.00 |
| 5V Small DC Cooling Fan | 1 | Greenhouse ventilation / exhaust | Rs. 190.00 |
| 1N4007 Rectifier Diode | 2 | Inductive flyback protection | Rs. 30.00 |
| 12V 2A Power Adapter & DC Pigtail | 1 | Actuator power supply | Rs. 60.00 |
| Male & Female Header Pins (Strip) | 2 | Modular wiring connectors | Rs. 230.00 |
| IDC Flat Wire Ribbon - 1M | 4 | Sensor cable runs | Rs. 400.00 |
| 2 Core Twin 24AWG Wire - 1M | 4 | Actuator power wiring | Rs. 200.00 |
| **Total (Approximate)** | | | **Rs. 3,630.00** |

> *Excludes: Heat shrink tubing, ultrasonic sensor bracket, and wire stripping tools.*

---

## 💻 Software Stack

### Firmware — GreenOS Library (Arduino)

| Module | File | Responsibility |
|:---|:---|:---|
| Main loop | `arduino/src/main.cpp` | Sensor polling, command dispatch, periodic emit |
| Automation controller | `greenOS_automation.cpp/.hpp` | AUTO mode logic, hysteresis, cooldown timers, relay control |
| Event protocol | `greenOS_events.hpp` | PROGMEM string constants for all UART messages |
| Event handler | `greenOS.cpp/.hpp` | Serial emit helpers for each sensor type |
| Ultrasonic | `greenOS_ultrasonic.cpp` | Filtered distance measurement & tank level % calculation |

### Backend — .NET 10 Gateway

| Concern | Technology |
|:---|:---|
| Framework | ASP.NET Core Web API (.NET 10) |
| UART Communication | `System.IO.Ports` with auto-discovery COM routine |
| Real-time Push | **ASP.NET Core SignalR** (WebSocket hub) |
| Background Service | `HardwareWorker` — reads UART, parses messages, forwards to hub |
| Hosting | Self-hosted Kestrel server |

### Frontend — React Dashboard

| Concern | Technology |
|:---|:---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 + Material Design 3 tokens |
| Real-time State | SignalR client (`@microsoft/signalr`) — event-driven, zero-polling |
| Charts | Chart.js + `react-chartjs-2` |
| Cloud Analytics | Firebase Realtime Database (`firebase` SDK) |
| Icons | Lucide React |

### Key Web UI Components

| Component | Description |
|:---|:---|
| `ModeToggleBar` | AUTO / MANUAL mode switch with live cooldown countdown badge |
| `WaterTankLevel` | Animated tank graphic with fill level and volume |
| `TempHumidity` | Arc gauges for temperature and humidity + derived metrics |
| `Photosynthesis` | Animated sun with dynamic light intensity + efficiency gauge |
| `SoilMoisture` | 4-sector radial gauge breakdown with per-zone health indicators |
| `AnalyticsTab` | Live chart, date comparison, weekly report, and AI recommendations |
| `SimulationBar` | Dev tool to inject mock sensor values for UI testing without hardware |
| `SettingsModal` | Configurable thresholds and system settings |
| `OfflineOverlay` | Full-screen banner when SignalR connection is lost |
| `ConnectionChip` | Live connection status indicator in the nav bar |

---

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- [PlatformIO](https://platformio.org/) or [Arduino IDE](https://www.arduino.cc/en/software) (for firmware upload)

---

### 1. Hardware Setup

1. Wire components according to the [circuit diagram](docs/circuit_diagram.svg).
2. Before connecting actuators, adjust the **LM2596S Buck Module** output to exactly **5.0V** using a multimeter.
3. Connect the **12V 2A DC adapter** to the power input jack.
4. Connect the Arduino to the host PC via USB.

> ⚠️ **Important:** Never connect the actuator power rail before verifying the Buck Module is tuned to 5V. Over-voltage will damage the pumps and relay module.

---

### 2. Firmware Upload

Using PlatformIO (recommended):

```bash
cd arduino
pio run --target upload
```

Using Arduino IDE: open `arduino/src/main.cpp` and upload to the board. The library in `arduino/lib/GreenOS/` must be present.

---

### 3. Backend Setup

```bash
# Navigate to the gateway project
cd uart-com

# Restore dependencies
dotnet restore

# Run the gateway (auto-discovers the Arduino COM port)
dotnet run
```

The gateway will auto-detect the Arduino's COM port on startup. The SignalR hub will be available at `http://localhost:5000/greenos`.

---

### 4. Frontend Setup

```bash
# Navigate to the Web UI project
cd webui

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at `http://localhost:5173` to access the live dashboard.

---

### 5. Firebase Setup (Analytics)

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Realtime Database**.
3. Update `webui/src/services/firebase.ts` with your project's config values and `databaseURL`.
4. Set Realtime Database rules to allow read/write for your use case.

---

### 6. Operating the System

Once running:

1. The dashboard connects to the SignalR hub and begins streaming live sensor data.
2. The system starts in **MANUAL mode** — no actuators fire automatically.
3. Use the **ModeToggleBar** to switch to **AUTO mode** for fully autonomous operation.
4. In Manual mode, use the dashboard controls to run the fan, water pump (with duration), or refill pump on demand.
5. Navigate to the **Analytics tab** to view live efficiency charts and historical Firebase data.
6. Click **Sync Now** on the Analytics tab to immediately push a data snapshot to Firebase.

---

### Automation Thresholds (configurable in firmware)

| Parameter | Default | Location |
|:---|:---:|:---|
| Moisture low threshold | 30% | `greenOS_automation.hpp` → `AUTO_MOISTURE_LOW` |
| Tank low threshold | 20% | `greenOS_automation.hpp` → `AUTO_WATER_TANK_LOW` |
| Tank full threshold | 80% | `greenOS_automation.hpp` → `AUTO_WATER_TANK_FULL` |
| Temperature high | 32°C | `greenOS_automation.hpp` → `AUTO_TEMP_HIGH` |
| Temperature recover | 28°C | `greenOS_automation.hpp` → `AUTO_TEMP_RECOVER` |
| Humidity high | 80% | `greenOS_automation.hpp` → `AUTO_HUM_HIGH` |
| Humidity recover | 70% | `greenOS_automation.hpp` → `AUTO_HUM_RECOVER` |
| Pump burst duration | 3s | `greenOS_automation.hpp` → `WATER_PUMP_DURATION_MS` |
| Pump cooldown | 60s | `greenOS_automation.hpp` → `WATER_PUMP_COOLDOWN_MS` |
| Fan cooldown | 30s | `greenOS_automation.hpp` → `FAN_COOLDOWN_MS` |
| Analytics log interval | 10s | `AnalyticsTab.tsx` → `LOG_INTERVAL_MS` |

---

<div align="center">

**National Institute of Business Management (NIBM)**
*Batch: 26.1F | Course: HND in Software Engineering*
*Module: Robotic Application Development*

</div>
