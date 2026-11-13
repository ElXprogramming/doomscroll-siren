# 🚨 Doomscroll Siren

> **Tactical Client-Side AI Focus Sentinel & Real-Time Phone Interceptor**
> Running YOLO11 Nano via ONNX WebAssembly with Embedded NMS and Dual-Oscillator Web Audio Synthesizer.

[![Latest Release](https://img.shields.io/github/v/release/ElXprogramming/doomscroll-siren?color=blue)](https://github.com/ElXprogramming/doomscroll-siren/releases)
[![CI](https://github.com/ElXprogramming/doomscroll-siren/actions/workflows/ci.yml/badge.svg)](https://github.com/ElXprogramming/doomscroll-siren/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/1a587c24-7709-40e9-bb18-849d091f90e5/deploy-status)](https://app.netlify.com/projects/doomscroll-siren/deploys)
[![Live App](https://img.shields.io/badge/LIVE%20DEMO-doomscroll--siren.netlify.app-00f2fe?style=for-the-badge&logo=netlify)](https://doomscroll-siren.netlify.app)
[![GitHub Stars](https://img.shields.io/github/stars/ElXprogramming/doomscroll-siren?style=social)](https://github.com/ElXprogramming/doomscroll-siren/stargazers)

🌐 **Live Deployment**: [https://doomscroll-siren.netlify.app](https://doomscroll-siren.netlify.app)  
📦 **GitHub Repository**: [https://github.com/ElXprogramming/doomscroll-siren](https://github.com/ElXprogramming/doomscroll-siren)

---

## 🎯 What is Doomscroll Siren?

**Doomscroll Siren** is an autonomous, privacy-first computer vision sentry that monitors your workspace via your webcam. Whenever you hold up your smartphone to doomscroll, the optical tracking pipeline calculates your exposure duration. If you fail to put your phone down before the time limit (default: **10.0s**), a piercing dual-oscillator tactical emergency siren erupts from your speakers, accompanied by a flashing crimson alert.

The instant you put the phone down, the siren halts.

---

## ⚡ Key Architectural Features

- **100% Client-Side Neural Inference**:
  - Powered by `onnxruntime-web` with `WebGPU` acceleration and automated fallback to multi-threaded `WASM`.
  - Zero server calls, zero video leaves your browser. 100% private.
- **Embedded NMS YOLO11n Model**:
  - Model exported with `nms=True` directly into the ONNX compute graph (`[1, 3, 640, 640]` input $\to$ `[1, 300, 6]` detections output).
  - Eliminates manual IoU box overlap calculations in TypeScript.
- **Anti-Flicker Grace Buffer**:
  - Solves the classic "flickering detection" problem.
  - If a hand briefly occludes the phone or motion blur occurs for a split second, the timer decays at **1.5x speed** rather than immediately dropping to zero.
  - Prevents cheating the 10-second limit by tilting the phone.
- **Dual-Oscillator Web Audio Synthesizer**:
  - Zero external `.mp3` or `.wav` dependencies.
  - Native `AudioContext` generating:
    - **Warning Chirps**: Short 880Hz square-wave warning beeps at whole second intervals past 5.0s.
    - **Emergency Siren**: Dual sweeping oscillators (sawtooth + detuned square) modulated by an LFO between 600Hz and 1300Hz.
- **Persisted Session Telemetry**:
  - Tracks **Times Caught (Siren Triggers)**, **Longest Clean Focus Streak**, and **Total Doomscroll Time Blocked** in `localStorage`.
- **Tactical Simulation Mode**:
  - Integrated debug toggle to test countdowns, warning beeps, and emergency sirens without holding up a physical phone.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom Tactical Cyberpunk Dark HUD theme
- **Inference Engine**: ONNX Runtime Web (`onnxruntime-web`)
- **Neural Model**: Ultralytics YOLO11n (COCO Class 0 `person`, Class 67 `cell phone`)
- **Audio Engine**: Browser native Web Audio API (`AudioContext`)
- **Icons & FX**: Lucide React + `canvas-confetti`

---

## 🚀 Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/ElXprogramming/doomscroll-siren.git
   cd doomscroll-siren
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🔒 Privacy & Permissions

Doomscroll Siren accesses your webcam strictly through standard browser media stream APIs (`navigator.mediaDevices.getUserMedia`). All frames are processed locally inside offscreen canvas memory. No image data or video feeds are ever stored, logged, or transmitted over the network.

---

## 🤝 Contributing & Security

Contributions and bug reports are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).
