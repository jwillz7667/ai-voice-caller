# AI Voice Caller - Powered by OpenAI & Twilio

A real-time voice calling application that integrates OpenAI's GPT-4o Realtime API with Twilio's phone calling capabilities to create an AI voice assistant that can make and receive phone calls.

![AI Voice Caller Interface](https://github.com/user-attachments/assets/d3c8dcce-b339-410c-85ca-864a8e0fc326)

## Features

- **Real-time Voice Conversations**: Engage in natural conversations with an AI assistant over the phone
- **Outgoing Call Support**: Initiate calls to phone numbers directly from the web interface
- **Incoming Call Handling**: Receive and process incoming calls through your Twilio number
- **Live Call Logs**: View real-time transcripts and logs of ongoing calls
- **Customizable AI Behavior**: Configure the AI's voice, instructions, and available tools
- **WebSocket Communication**: Reliable real-time communication between all components
- **Collapsible Sidebar Navigation**: Professional UI with expandable/collapsible sidebar for easier navigation
- **Centralized Environment Management**: Streamlined configuration with standardized environment variables
- **Settings Page**: Dedicated page for application configuration and preferences

## System Architecture

The system consists of three main components:

1. **Frontend Web Application** (`webapp/`): A Next.js application that provides the user interface for configuring calls and viewing logs
2. **WebSocket Server** (`websocket-server/`): An Express server that manages connections between Twilio, OpenAI, and the frontend
3. **Twilio Integration**: Handles the telephony aspects using Twilio's Voice API

![Architecture Diagram](https://github.com/user-attachments/assets/61d39b88-4861-4b6f-bfe2-796957ab5476)

## Quick Setup

### Prerequisites

- Node.js (v18 or later)
- npm
- A Twilio account with a phone number capable of voice calls
- An OpenAI API key with access to GPT-4o Realtime preview model
- ngrok for exposing your local server to the internet

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/jwillz7667/ai-voice-caller.git
   cd ai-voice-caller
   ```

2. **Install dependencies**
   ```bash
   # Install webapp dependencies
   cd webapp
   npm install
   
   # Install websocket server dependencies
   cd ../websocket-server
   npm install
   ```

3. **Configure environment variables**

   Create `.env` files based on the provided `.env.example` templates in both the `webapp/` and `websocket-server/` directories:

   **webapp/.env.example**
   ```
   # Twilio
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Backend ngrok url (same ngrok url used in websocket-server/.env)
   BACKEND_URL=your_backend_ngrok_url
   ```

   **websocket-server/.env.example**
   ```
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Backend ngrok url (same ngrok url used in webapp/.env)
   PUBLIC_URL=your_backend_ngrok_url
   ```

   Note: The project uses a centralized environment variables system to ensure consistency between components. Make sure both `.env` files are properly configured.

4. **Start the application**

   Open three terminal windows:

   **Terminal 1 - Start the frontend**
   ```bash
   cd webapp
   npm run dev
   ```

   **Terminal 2 - Start the WebSocket server**
   ```bash
   cd websocket-server
   npm run dev
   ```

   **Terminal 3 - Start ngrok tunnel**
   ```bash
   ngrok http 8081
   ```

5. **Configure Twilio**
   - In your Twilio console, set the Voice Webhook URL to `https://your-ngrok-url/twiml`
   - Make sure to update your environment variables with the new ngrok URL whenever it changes

## Usage

### Making an Incoming Call
1. Navigate to your Twilio-assigned phone number
2. Call the number from any phone
3. The AI assistant will answer and engage in conversation

### Making an Outgoing Call
1. Open the web application at http://localhost:3000
2. Enter the phone number you want to call in the dialer section
3. Click "Call" to initiate the call
4. Wait for the recipient to answer and speak with the AI assistant

### Navigating the Interface
1. Use the collapsible sidebar to navigate between different sections:
   - **Dashboard/Call Interface**: Main calling interface for making outgoing calls
   - **Logs**: View real-time transcription and call events
   - **Settings**: Configure application preferences and settings
2. Collapse the sidebar by clicking the arrow icon to maximize screen space
3. Expand the sidebar to see full navigation labels

### Viewing Logs
1. During a call, click the "Logs" option in the sidebar
2. View the real-time transcription and call events
3. Use the sidebar to navigate back to the main interface

## Troubleshooting

### Common Issues

1. **No audio from AI assistant**
   - Check the OpenAI API key has access to GPT-4o Realtime model
   - Verify Twilio webhook is correctly set to your ngrok URL + "/twiml"
   - Ensure audio format is set correctly (g711_ulaw_8khz)

2. **WebSocket connection fails**
   - Verify ngrok is running and the URLs in your .env files match
   - Check that the WebSocket server is running on port 8081
   - Ensure no firewall is blocking WebSocket connections

3. **Twilio errors**
   - Validate your Twilio credentials in both .env files
   - Check that your Twilio phone number has voice capabilities enabled
   - Verify TwiML configuration is correct

## Development

### Directory Structure

```
ai-voice-caller/
├── webapp/                  # Next.js frontend application
│   ├── app/                 # Next.js app directory
│   │   ├── logs/            # Call logs page
│   │   ├── settings/        # Settings page
│   ├── components/          # React components
│   │   ├── sidebar.tsx      # Collapsible navigation sidebar
│   │   ├── client-layout.tsx # Client-side layout component
│   └── public/              # Static assets
├── websocket-server/        # Express WebSocket server
│   ├── src/                 # Server source code
│   └── twiml.xml            # Twilio Markup Language template
```

### Key Files

- `webapp/components/call-interface.tsx`: Main call interface component
- `webapp/components/sidebar.tsx`: Collapsible navigation sidebar
- `webapp/app/logs/page.tsx`: Live call logs page
- `webapp/app/settings/page.tsx`: Settings configuration page
- `websocket-server/src/server.ts`: WebSocket server implementation
- `websocket-server/src/sessionManager.ts`: Manages connections and message passing
- `websocket-server/src/twiml.xml`: TwiML template for Twilio

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [OpenAI](https://openai.com/) for the GPT-4o Realtime API
- [Twilio](https://www.twilio.com/) for the Voice API
- [Next.js](https://nextjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend server
