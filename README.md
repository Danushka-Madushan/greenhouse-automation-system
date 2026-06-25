<div align="center">

<img src="https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/refs/heads/main/webui/public/favicon.svg" width="80" height="80" alt="Greenhouse Automation System Logo" />

# Greenhouse Automation System

**An affordable, Arduino-powered greenhouse automation solution with real-time remote monitoring.**

[![Platform](https://img.shields.io/badge/Platform-Arduino%20Uno%20R3-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Backend](https://img.shields.io/badge/Backend-.NET%2010-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Institution](https://img.shields.io/badge/NIBM-HND--SE%20%7C%20Batch%2026.1F-blue)](https://www.nibm.lk/)

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#️-system-architecture)
- [System Design](#️-system-design)
- [Hardware Specifications](#-hardware-specifications-bom)
- [Software Stack](#-software-stack)
- [Getting Started](#-getting-started)

## 🌿 Overview

Greenhouse farming - a form of **Controlled Environment Agriculture (CEA)** - demands precise control over temperature, humidity, and sunlight to maximize crop yields. However, conventional automation solutions rely on expensive industrial equipment that puts remote monitoring out of reach for small-scale farmers.

This project addresses two core problems:

- **High Cost:** Industrial greenhouse systems are unaffordable for small-scale crop farms.
- **No Remote Access:** Most systems require physical on-site presence to monitor and control the environment.

The **Greenhouse Automation System** is a **low-cost, remotely-operable solution** that delivers closed-loop autonomous control through multi-zone sensing, intelligent weather-aware irrigation, and a live web dashboard - all for under **Rs. 5,000** in hardware.

## 🌟 Key Features

### 🌱 1. Multi-Zone Soil Moisture Monitoring & Control
- Monitors soil moisture independently across **4 distinct greenhouse zones** via capacitive sensors.
- Computes collective averages to assess overall soil water levels.
- **Automatically activates the irrigation pump** when moisture falls below a configured threshold.
- Provides a **soil health indicator** to determine whether conditions are optimal for farming.

### 🌡️ 2. Air Temperature & Humidity Control
- Continuously measures internal greenhouse air temperature and humidity using the **DHT22 sensor**.
- **Automatically triggers the exhaust fan** when readings exceed user-defined thresholds to regulate the climate.

### ☀️ 3. Greenhouse Efficiency (Sunlight) Monitoring
- Detects ambient light levels using the **BH1750 I²C light sensor**.
- Streams photosynthesis-relevant lux data to the dashboard to identify peak efficiency periods.

### 💧 4. Water Tank & Reservoir Level Monitoring
- Uses the **HC-SR04 ultrasonic sensor** for non-contact, continuous water level measurement.
- Displays live tank levels on the dashboard with **low-water alerts**.
- **Automatically activates the refill pump** when the reservoir drops below the minimum threshold.

### 🌦️ 5. Weather-Aware Crop Watering
- Integrates with a **live Weather API** using a user-configured location set from the dashboard.
- **Delays irrigation automatically** if rainfall is forecasted, conserving water and preventing oversaturation.

### 🖥️ 6. Interactive Monitoring Dashboard (UART → SignalR)
- **Real-time telemetry** streamed from the Arduino to a React web dashboard via a .NET SignalR hub.
- **Manual override** controls for all actuators (irrigation pump, refill pump, exhaust fan).
- **Configurable thresholds** for soil moisture and humidity directly from the UI.
- **Location setting** for the Weather API integration.

## 🏗️ System Architecture

The system follows a **Decoupled Gateway Architecture**, isolating low-level hardware polling from high-level automation and web communication logic.

![Block Diagram](https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/d42b4329a816e44b1e8fc3f3256965057ed9d206/docs/block_diagram.svg)

### Data Flow

```
[Sensors] ──► [Arduino Uno R3] ──UART/USB──► [.NET 10 Gateway]
                                                     │
                              ┌──────────────────────┤
                              │                      │
                     [Weather API]           [SignalR Hub]
                                                     │
                                             [React Dashboard]
                                                     │
                                    [User Commands / Overrides]
                                                     │
                             [.NET Gateway] ──UART──► [Arduino] ──► [Relay → Actuators]
```

### Logic Loop (Step by Step)

| Step | Layer | Action |
|:---:|:---|:---|
| 1 | **Sense** | Arduino polls all 7 environmental sensors every second |
| 2 | **Broadcast** | Raw sensor data is streamed over UART (Serial USB) to the C# Gateway |
| 3 | **Process** | .NET backend fetches Weather API data and applies zone-priority automation logic |
| 4 | **Sync** | SignalR pushes live telemetry to the React Web UI without polling |
| 5 | **Actuate** | C# sends operational commands back to Arduino, toggling the 4-channel relay |

## 🛠️ System Design

The physical layout connects sensors distributed across greenhouse zones to a centralized Arduino controller, with isolated power paths for logic and actuator circuits.

![System Design](https://raw.githubusercontent.com/Danushka-Madushan/greenhouse-automation-system/refs/heads/main/docs/system_design.svg)

### Power Strategy - Hardware Isolation

To ensure stability and protect the microcontroller from inductive spikes:

| Domain | Source | Regulation |
|:---|:---|:---|
| **Logic** (Arduino + Sensors) | PC USB (5V) | Native USB power |
| **Actuators** (Pumps + Fan) | 12V 2A DC Adapter | Stepped down to **5V** via LM2596S Buck Module |

> **Protection:** 1N4007 flyback diodes are placed across all motor terminals to suppress inductive voltage spikes from the pumps and fan.

## 📦 Hardware Specifications (BOM)

| Component | Qty | Purpose | Approx. Cost |
|:---|:---:|:---|---:|
| Arduino Uno R3 | 1 | Hardware Abstraction Layer (HAL) / Brain | - *(provided by NIBM)* |
| Capacitive Soil Moisture Sensor v1.2 | 4 | Multi-zone substrate moisture monitoring | Rs. 880.00 |
| DHT22 / AM2302 Module | 1 | Air temperature & humidity sensing | Rs. 380.00 |
| HC-SR04 Ultrasonic Sensor | 1 | Non-contact water level measurement | Rs. 260.00 |
| BH1750 Light Sensor Module | 1 | Sunlight / photosynthesis efficiency monitoring | Rs. 450.00 |
| 5V Mini Submersible Water Pump | 2 | Irrigation & autonomous reservoir refill | Rs. 430.00 |
| 5V 4-Channel Relay Module | 1 | High-current actuator switching | Rs. 560.00 |
| LM2596S Adjustable Buck Module | 1 | Isolated 5V actuator power regulation | Rs. 620.00 |
| 5V Small DC Cooling Fan | 1 | Greenhouse ventilation / exhaust | Rs. 190.00 |
| 1N4007 Rectifier Diode | 2 | Inductive flyback protection | Rs. 30.00 |
| 12V 2A Power Adapter & DC Pigtail | 1 | Actuator power supply | Rs. 60.00 |
| Male & Female Header Pins (Strip) | 2 | Modular wiring connectors | Rs. 230.00 |
| IDC Flat Wire Ribbon - 1M | 4 | Sensor cable runs | Rs. 400.00 |
| 2 Core Twin 24AWG Wire - 1M | 4 | Actuator power wiring | Rs. 200.00 |
| **Total (Approximate)** | | | **Rs. 4,690.00** |

> *Excludes: Heat shrink tubing, ultrasonic sensor bracket, and wire stripping tools.*

## 💻 Software Stack

### Backend - .NET 10 Gateway

| Concern | Technology |
|:---|:---|
| Framework | ASP.NET Core Web API (.NET 10) |
| UART Communication | `System.IO.Ports` with auto-discovery COM routine |
| Real-time Push | **ASP.NET Core SignalR** (WebSocket hub) |
| Weather Integration | External Weather REST API (location configured via dashboard) |
| Hosting | Self-hosted with System Tray integration |

### Frontend - React Dashboard

| Concern | Technology |
|:---|:---|
| Library | **React + Vite** |
| Real-time State | SignalR client — event-driven, zero-polling |
| Controls | Manual override toggles for all actuators |
| Configuration | Threshold & location settings panel |

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- [Arduino IDE](https://www.arduino.cc/en/software) (for firmware upload)

### 1. Hardware Setup

1. Flash the Arduino firmware located in the `/arduino` directory using the Arduino IDE.
2. Before connecting any actuators, adjust the **LM2596S Buck Module** output to exactly **5.0V** using a multimeter.
3. Connect the **12V 2A DC adapter** to the power input jack.
4. Connect the Arduino to the host PC via USB.

> ⚠️ **Important:** Never connect the actuator power rail before verifying the Buck Module is tuned to 5V. Over-voltage will damage the pumps and relay module.

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/Danushka-Madushan/greenhouse-automation-system.git
cd greenhouse-automation-system

# Navigate to the gateway project
cd uart-com

# Restore dependencies
dotnet restore

# Run the gateway (auto-discovers the Arduino COM port)
dotnet run
```

The gateway will auto-detect the Arduino's COM port on startup. The SignalR hub will be available at `http://localhost:5000/greenos`.

### 3. Frontend Setup (manual run)

```bash
# Navigate to the Web UI project
cd ../webui

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at `http://localhost:5173` to access the live dashboard.

### 4. Configuration

Once the dashboard is running:

1. Navigate to **Settings** to configure your **location** for the Weather API integration.
2. Set your preferred **soil moisture**, **water tank size** and **humidity thresholds**.
3. All actuators can be toggled manually from the **Control Panel** tab.

<div align="center">

**National Institute of Business Management (NIBM)**
*Batch: 26.1F | Course: HND in Software Engineering*

</div>
