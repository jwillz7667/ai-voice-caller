# WebSocket Server for OpenAI Realtime Audio with Twilio Integration

This server handles the WebSocket connections between Twilio, the frontend, and OpenAI's Realtime API for voice calls.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   
   This will install all required dependencies including ngrok, which is now included as a project dependency.

2. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your:
   - OpenAI API key
   - Twilio credentials (for outbound calling)
   - Other configuration options

## Running the Server

### Development Mode

Run the server in development mode with live reloading:
```bash
npm run dev
```

### Development with Custom Port

Run with a custom port:
```bash
npm run dev:port 3001
```

### Production Build

Build and run in production:
```bash
npm run build
npm start
```

## Ngrok Integration

The server now supports dynamic port configuration with automatic ngrok integration.

### Running with Ngrok

Ngrok is now included as a project dependency, so you don't need to install it separately. To start the server with ngrok tunneling (automatically uses the same port):
```bash
npm run build  # Build first
npm run start:ngrok
```

This will:
1. Start the server on a port (specified in .env, command line, or random)
2. Launch ngrok to expose that port to the internet
3. Automatically update both the websocket-server AND webapp .env files with the new ngrok URL
4. Both will shut down together when you press Ctrl+C

If ngrok fails to start, the server will continue running locally, and you'll see instructions for manually starting ngrok.

### Ngrok Troubleshooting

If you encounter issues with ngrok:

1. **Authentication**: You may need to authenticate ngrok first:
   ```bash
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

2. **Already Running**: Make sure no other ngrok instances are running (check other terminal windows)

3. **Connection Limits**: Free ngrok accounts have connection limits. You may need to wait or upgrade.

4. **Port Already in Use**: The script will automatically try different ports if the first one is busy.

### Manual Ngrok Setup

If you prefer to run ngrok separately:
1. Start the server: `npm start`
2. In another terminal, run: `ngrok http PORT` (replace PORT with your server port)
3. Copy the ngrok URL to your `.env` file as `PUBLIC_URL`

## Environment Variables

- `PORT`: Server port (default: 8081)
- `NODE_ENV`: Environment mode (development/production)
- `ALLOWED_ORIGIN`: CORS allowed origin
- `PUBLIC_URL`: Your ngrok URL or public domain
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL_URL`: OpenAI Realtime API URL with model 
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number for outbound calls 