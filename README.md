# AI Voice Caller

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Add other relevant badges here: build status, deployment, etc. -->

## Overview

Welcome to the AI Voice Caller project! This application enables users to interact with an AI through voice, simulating a phone call experience. It combines a web-based frontend with a real-time WebSocket backend for communication.

*(Add a more detailed description of the project's goals and purpose here)*

## Features

*   **Real-time Voice Interaction:** Communicate with an AI using your voice.
*   **Web Interface:** User-friendly interface for managing calls and settings.
*   **WebSocket Communication:** Ensures low-latency communication between the client and server.
*   *(List other key features, e.g., specific AI capabilities, call management features, etc.)*

## Architecture

The project is divided into two main components:

1.  **`webapp/`**: A [Next.js](https://nextjs.org/) frontend application providing the user interface. It handles user input, displays conversation history, and communicates with the WebSocket server. Built with React, TypeScript, and Tailwind CSS.
2.  **`websocket-server/`**: A [Node.js](https://nodejs.org/) backend server using WebSockets (`ws` or similar library) to manage real-time communication, interact with the AI model (e.g., processing audio, generating responses), and relay information back to the web client. Built with TypeScript.

*(Add a diagram or more detailed explanation of the interaction flow if desired)*

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version >= specified in package.json files)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jwillz7667/Outbound-AI-Voice-Calling.git
    cd Outbound-AI-Voice-Calling # Assuming this is the directory name after cloning
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd webapp
    npm install
    # or
    # yarn install
    cd ..
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd websocket-server
    npm install
    # or
    # yarn install
    cd ..
    ```

### Environment Variables

Both the `webapp` and `websocket-server` require environment variables to function correctly.

1.  **Frontend (`webapp/`):**
    *   Copy the example environment file: `cp .env.example .env`
    *   Fill in the required values in `.env` (e.g., API keys, WebSocket server URL).

2.  **Backend (`websocket-server/`):**
    *   Navigate to the `websocket-server` directory.
    *   Copy the example environment file: `cp .env.example .env`
    *   Fill in the required values in `.env` (e.g., API keys, ports, AI service credentials).

## Running the Application

You need to run both the WebSocket server and the web application.

1.  **Start the WebSocket Server:**
    ```bash
    cd websocket-server
    npm run dev # Or your actual start script (e.g., npm start, npm run build && npm start)
    ```

2.  **Start the Web Application:**
    *   In a **separate terminal**:
    ```bash
    cd webapp
    npm run dev # Or your actual start script
    ```

By default, the web application should be accessible at `http://localhost:3000` (or the port configured in Next.js). The WebSocket server will be running on the port specified in its configuration.

## Usage

*(Describe how to use the application. Include screenshots or GIFs if helpful.)*
1.  Open your browser to `http://localhost:3000`.
2.  *(Explain steps to initiate a call, interact, etc.)*

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -am 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Create a new Pull Request.

*(Add more specific contribution guidelines if needed, e.g., coding standards, testing requirements.)*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 