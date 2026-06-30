# PewPaw

PewPaw is a modern, lightweight, and sleek desktop client for WhatsApp, built with a decoupled architecture. It separates the backend (Go + `whatsmeow`) and the frontend (C++ Qt WebEngine + HTML/CSS/JS) to deliver a seamless, high-performance messaging experience.

## Features

- **Premium Dark Mode UI**: A stunning, modern interface featuring glassmorphism, smooth animations, and a sleek dark theme.
- **Decoupled Architecture**: 
  - **Backend**: Written in Go using the [whatsmeow](https://github.com/tulir/whatsmeow) library to handle WhatsApp's Web WebSocket protocol.
  - **Frontend**: A Qt WebEngine (C++) container that renders a local HTML/JS/CSS application and communicates with the backend via QWebChannel IPC.
- **Real-Time Messaging**: Send and receive messages instantly.
- **Local Message Echoing**: Messages appear in the UI immediately upon sending for a responsive experience.
- **Reply Context**: Reply to specific messages easily.
- **Typing Indicators**: See when the other person is typing in real-time.
- **QR Code Authentication**: Easy login by scanning a Base64-generated QR code right inside the app.
- **Robust Database**: Uses SQLite to securely manage sessions (`katana.db`) and user contacts (`userstore.db`).

## Prerequisites

- Go 1.25+
- Qt 6 (with WebEngine support)
- CMake
- Make
- A C++ Compiler (GCC/Clang)

## Build Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/COXKPER/PewPaw.git
   cd PewPaw
   ```

2. **Build the Backend:**
   ```bash
   cd backend
   go build -o pewpawd .
   ```

3. **Build the Frontend:**
   ```bash
   cd ../frontend
   mkdir -p build
   cd build
   cmake ..
   make
   ```

## Usage

1. Start the backend daemon:
   ```bash
   ./backend/pewpawd
   ```
   *Note: Ensure you have write permissions to `/var/lib/pewpaw` or modify the `DataDir` constant in `backend/database/init.go` to a user-writable directory before running.*

2. Start the frontend application:
   ```bash
   ./frontend/build/pewpaw
   ```

3. If you haven't logged in, the app will present a QR code. Scan it using your WhatsApp mobile app (Linked Devices).

## License

This project is licensed under the GNU Lesser General Public License (LGPL). See the [LICENSE](LICENSE) file for more details.
