const { spawn } = require('child_process');
const path = require('path');
const { randomInt } = require('crypto');
const fs = require('fs');
const net = require('net');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Path to .env files
const WEBSOCKET_ENV_PATH = path.join(__dirname, '../.env');
const WEBAPP_ENV_PATH = path.join(__dirname, '../../webapp/.env');

// Generate a random port between 3000 and 9000 if not specified
let PORT = parseInt(process.env.PORT || process.argv[2] || "8081", 10);

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false); // Port is in use
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port);
  });
}

// Find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  let maxAttempts = 10;
  
  while (maxAttempts > 0) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port = 3000 + randomInt(7000); // Try a random port
    maxAttempts--;
  }
  
  throw new Error('Could not find an available port after multiple attempts');
}

// Check if ngrok is properly configured
async function checkNgrokSetup() {
  try {
    // Try to connect to ngrok API 
    const server = net.createServer();
    
    const isNgrokRunning = await new Promise((resolve) => {
      const testConnection = net.createConnection({ port: 4040 }, () => {
        testConnection.end();
        resolve(true);
      });
      
      testConnection.on('error', () => {
        resolve(false);
      });
    });
    
    if (isNgrokRunning) {
      console.log('Ngrok is already running. You may need to stop existing ngrok instances.');
    }
    
    return;
  } catch (error) {
    console.log('Unable to check ngrok status:', error.message);
  }
}

// Start the server only
async function startServerOnly() {
  try {
    // Find an available port
    PORT = await findAvailablePort(PORT);
    console.log(`Starting server on port ${PORT} (without ngrok)...`);
    
    // Start the server with the selected port
    const server = spawn('node', [path.join(__dirname, '../dist/server.js'), PORT.toString()], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: PORT.toString()
      }
    });
    
    console.log(`⚠️ Failed to start ngrok. Server is running at http://localhost:${PORT}`);
    console.log(`To expose this server manually, run: ngrok http ${PORT}`);
    
    // Handle process termination
    const cleanup = () => {
      console.log('\nShutting down server...');
      server.kill();
      process.exit(0);
    };
    
    // Listen for termination signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Handle child process errors
    server.on('error', (err) => {
      console.error('Server process error:', err);
      cleanup();
    });
    
    // Log when server exits
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server and ngrok
async function start() {
  try {
    // Check if ngrok is properly set up
    await checkNgrokSetup();
    
    // Find an available port
    PORT = await findAvailablePort(PORT);
    console.log(`Starting server on port ${PORT}...`);
    
    // Start the server with the selected port
    const server = spawn('node', [path.join(__dirname, '../dist/server.js'), PORT.toString()], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: PORT.toString()
      }
    });
    
    // Function to update the .env file with the new PUBLIC_URL
    function upsertEnvVar(filePath, key, value) {
      try {
        if (!fs.existsSync(filePath)) return;
        let envContent = fs.readFileSync(filePath, 'utf8');
        const line = `${key}=${value}`;
        const re = new RegExp(`^${key}=.*$`, 'm');
        if (re.test(envContent)) {
          envContent = envContent.replace(re, line);
        } else {
          if (envContent && !/\n$/.test(envContent)) envContent += "\n";
          envContent += line + "\n";
        }
        fs.writeFileSync(filePath, envContent);
      } catch (e) {
        console.error(`Failed writing ${key} to ${filePath}:`, e.message);
      }
    }

    function updateEnvFile(filePath, url) {
      try {
        if (!fs.existsSync(filePath)) {
          console.log(`Warning: ${filePath} does not exist, skipping update`);
          return;
        }
        upsertEnvVar(filePath, 'PUBLIC_URL', url);
        console.log(`✅ Updated ${filePath} PUBLIC_URL: ${url}`);
      } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
      }
    }

    // Function to update both .env files
    function readEnv(filePath) {
      try {
        const text = fs.readFileSync(filePath, 'utf8');
        const obj = {};
        text.split(/\r?\n/).forEach((l) => {
          const m = l.match(/^([^#=]+)=(.*)$/);
          if (m) obj[m[1].trim()] = m[2].trim();
        });
        return obj;
      } catch {
        return {};
      }
    }

    function updateAllEnvFiles(url) {
      // Update websocket-server .env
      updateEnvFile(WEBSOCKET_ENV_PATH, url);
      const wssBase = url.replace(/^http/, 'ws').replace(/^https/, 'wss');
      upsertEnvVar(WEBSOCKET_ENV_PATH, 'WS_PUBLIC_URL', wssBase);

      // Determine webapp origin to allow in CORS
      const webappEnv = readEnv(WEBAPP_ENV_PATH);
      const webappOrigin = webappEnv.PUBLIC_URL || process.env.WEBAPP_URL || 'http://localhost:3000';
      upsertEnvVar(WEBSOCKET_ENV_PATH, 'ALLOWED_ORIGIN', webappOrigin);
      console.log(`✅ Updated ${WEBSOCKET_ENV_PATH} ALLOWED_ORIGIN: ${webappOrigin}`);

      // Update webapp .env for both HTTP backend and WS logs
      try {
        const u = new URL(url);
        const wsLogs = `wss://${u.host}/logs`;
        upsertEnvVar(WEBAPP_ENV_PATH, 'NEXT_PUBLIC_WEBSOCKET_URL', wsLogs);
        upsertEnvVar(WEBAPP_ENV_PATH, 'BACKEND_URL', `https://${u.host}`);
        upsertEnvVar(WEBAPP_ENV_PATH, 'PUBLIC_URL', `https://${u.host}`);
        console.log(`✅ Updated ${WEBAPP_ENV_PATH} NEXT_PUBLIC_WEBSOCKET_URL: ${wsLogs}`);
        console.log(`✅ Updated ${WEBAPP_ENV_PATH} BACKEND_URL & PUBLIC_URL: https://${u.host}`);
      } catch (e) {
        console.warn('Could not compute URLs from', url, e.message);
      }
    }

    // Modified function to start ngrok using spawn
    async function startNgrok() {
      return new Promise((resolve, reject) => {
        try {
          console.log('Starting ngrok tunnel...');
          
          // Launch ngrok as a child process with absolute path
          const ngrokPath = '/opt/homebrew/bin/ngrok';
          const ngrokProcess = spawn(ngrokPath, ['http', PORT.toString()], {
            stdio: ['ignore', 'pipe', 'pipe']
          });
          
          let ngrokUrl = null;
          let ngrokError = '';
          
          // Parse ngrok output to find the public URL
          ngrokProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Ngrok:', output);
            
            // Look for the forwarding URL in the output
            const forwardingMatch = output.match(/Forwarding\s+(https:\/\/[a-zA-Z0-9\-]+\.ngrok-free\.app)/);
            if (forwardingMatch && forwardingMatch[1]) {
              ngrokUrl = forwardingMatch[1];
              console.log(`✅ Server exposed at: ${ngrokUrl}`);
              
              // Update environment variable for the server process
              process.env.PUBLIC_URL = ngrokUrl;
              
              // Update all .env files with the new URL
              updateAllEnvFiles(ngrokUrl);
              // Kick Twilio webhook updater
              try {
                const child = spawn('node', [path.join(__dirname, 'update-twilio-webhook.js')], { stdio: 'inherit' });
                child.on('close', (code) => console.log('Twilio webhook update exited with', code));
              } catch (e) {
                console.warn('Failed to spawn update-twilio-webhook:', e.message);
              }
              
              resolve(ngrokUrl);
            }
          });
          
          // Check for errors
          ngrokProcess.stderr.on('data', (data) => {
            ngrokError += data.toString();
            console.error('Ngrok error:', data.toString());
          });
          
          // Handle process exit
          ngrokProcess.on('exit', (code) => {
            if (code !== 0 && !ngrokUrl) {
              console.error(`Ngrok exited with code ${code}`);
              console.error(ngrokError);
              reject(new Error(`Ngrok failed with code ${code}`));
            }
          });
          
          // Set a timeout in case ngrok starts but we don't catch the URL
          setTimeout(() => {
            if (!ngrokUrl) {
              console.log('Checking for ngrok web interface at http://localhost:4040...');
              // Try to get the URL from the ngrok API
              http.get('http://localhost:4040/api/tunnels', (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                  data += chunk;
                });
                
                res.on('end', () => {
                  try {
                    const tunnels = JSON.parse(data);
                    if (tunnels.tunnels && tunnels.tunnels.length > 0) {
                      ngrokUrl = tunnels.tunnels[0].public_url;
                      console.log(`✅ Found ngrok URL via API: ${ngrokUrl}`);
                      
                      // Update environment variable for the server process
                      process.env.PUBLIC_URL = ngrokUrl;
                      
                      // Update all .env files with the new URL
                      updateAllEnvFiles(ngrokUrl);
                      try {
                        const child = spawn('node', [path.join(__dirname, 'update-twilio-webhook.js')], { stdio: 'inherit' });
                        child.on('close', (code) => console.log('Twilio webhook update exited with', code));
                      } catch (e) {
                        console.warn('Failed to spawn update-twilio-webhook:', e.message);
                      }
                      
                      resolve(ngrokUrl);
                    } else {
                      reject(new Error('No active ngrok tunnels found'));
                    }
                  } catch (error) {
                    reject(new Error(`Failed to parse ngrok API response: ${error.message}`));
                  }
                });
              }).on('error', (error) => {
                reject(new Error(`Failed to get ngrok URL: ${error.message}`));
              });
            }
          }, 5000);
          
          // Add the ngrok process to global scope for cleanup
          global.ngrokProcess = ngrokProcess;
        } catch (error) {
          console.error('Error starting ngrok:', error);
          reject(error);
        }
      });
    }

    // Start ngrok
    let ngrokUrl;
    try {
      ngrokUrl = await startNgrok();
    } catch (error) {
      console.error('Error with ngrok:', error.message);
      console.error('Common ngrok issues:');
      console.error('1. Ngrok might not be properly authenticated - run "ngrok authtoken YOUR_TOKEN" separately');
      console.error('2. An existing ngrok process may be running - check for other terminal windows');
      console.error('3. You may have hit ngrok connection limits on the free plan');
      ngrokUrl = null;
    }
    
    // If ngrok failed, we're just running the server
    if (!ngrokUrl) {
      console.log(`⚠️ Server is running at http://localhost:${PORT} without ngrok`);
    }

    // Handle process termination
    const cleanup = async () => {
      console.log('\nShutting down server and ngrok...');
      try {
        if (global.ngrokProcess) {
          global.ngrokProcess.kill();
          console.log('Ngrok process terminated');
        }
      } catch (err) {
        console.error('Error closing ngrok:', err);
      }
      server.kill();
      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Handle child process errors
    server.on('error', (err) => {
      console.error('Server process error:', err);
      cleanup();
    });

    // Log when server exits
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      cleanup();
    });
  } catch (error) {
    console.error('Error:', error);
    
    // If something went wrong during setup, try to just start the server
    await startServerOnly();
  }
}

// Start everything
start(); 
