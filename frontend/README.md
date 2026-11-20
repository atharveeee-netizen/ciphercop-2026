# UAV Telemetry Dashboard

Real-time drone flight monitoring and visualization dashboard built with React, TypeScript, and Vite.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

## Overview

A professional-grade UAV telemetry dashboard that simulates and visualizes real-time drone flight data. Features interactive maps, aviation-style instruments, historical charts, and an intelligent alert system — all in a dark avionic-themed interface.

## Screenshot
<img width="1433" height="661" alt="Ekran Resmi 2026-02-18 00 33 26" src="https://github.com/user-attachments/assets/addf564e-c552-4875-a886-a2144689e663" />


## Features

- **Real-time Map** — Live drone position tracking with Leaflet, flight path history, waypoints, and geofence visualization
- **Instrument Gauges** — Aviation-style altitude, speed, heading, and battery gauges
- **Artificial Horizon** — Canvas-rendered attitude indicator with pitch, roll, and bank angles
- **Telemetry Charts** — Time-series altitude and speed graphs with Recharts
- **Sensor Monitoring** — Temperature, pressure, wind speed, GPS satellites, HDOP, RSSI
- **Alert System** — Multi-level alerts (INFO/WARNING/CRITICAL) with cooldown mechanism
- **Mission Tracker** — Visual phase progression (Pre-flight → Takeoff → En Route → On Station → RTL → Landing)
- **Responsive Design** — Desktop, tablet, and mobile layouts
- **Flight Simulation** — Realistic waypoint-based navigation with sensor noise injection

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 |
| Mapping | Leaflet + React-Leaflet |
| Charts | Recharts |
| Animation | Framer Motion |

## Project Structure

```
src/
├── components/
│   ├── alerts/         # Alert panel and alert items
│   ├── charts/         # Altitude & speed time-series charts
│   ├── gauges/         # Aviation-style instrument gauges
│   ├── horizon/        # Canvas-based artificial horizon
│   ├── layout/         # Dashboard grid, header, mission status bar
│   ├── map/            # Leaflet map, drone marker, flight path, waypoints, geofence
│   └── sensors/        # Sensor readings panel
├── hooks/              # Custom hooks (useTelemetry, useAlerts, useFlightTimer)
├── simulation/         # Telemetry engine, flight path generator, noise functions
├── store/              # Zustand store for global state
├── types/              # TypeScript type definitions
├── utils/              # Helpers (Haversine, formatters, constants)
├── styles/             # Global CSS
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/uav-telemetry-dashboard.git
cd uav-telemetry-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
# Type check and build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

1. **Simulation Engine** generates realistic telemetry data every 500ms, including position, attitude, velocity, battery, and sensor readings.
2. **Flight Path System** follows a 6-waypoint mission plan around Ankara, Turkey with 5-meter step resolution and altitude interpolation.
3. **Zustand Store** manages global state with bounded history buffers (200 path points, 120 chart points).
4. **Alert Hook** monitors telemetry for dangerous conditions (low battery, high altitude, weak signal, strong wind) with cooldown to prevent spam.
5. **React Components** subscribe to store slices and render optimized UI with `React.memo` and selective Zustand selectors.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## License

MIT
