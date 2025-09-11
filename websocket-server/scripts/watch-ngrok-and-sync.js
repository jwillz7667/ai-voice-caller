/*
 Watches the local ngrok API for public URL changes and syncs:
 - websocket-server/.env: PUBLIC_URL, WS_PUBLIC_URL
 - webapp/.env: NEXT_PUBLIC_WEBSOCKET_URL (wss://host/logs)
 - Twilio Incoming Phone Number voiceUrl and statusCallback

 Usage:
   node scripts/watch-ngrok-and-sync.js [--interval 3000] [E164_PHONE_NUMBER]

 Requires:
   - ngrok running locally with API on http://localhost:4040
   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in websocket-server/.env
   - TWILIO_PHONE_NUMBER (fallback if phone not passed)
*/

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const WEBSOCKET_ENV_PATH = path.join(__dirname, '../.env');
const WEBAPP_ENV_PATH = path.join(__dirname, '../../webapp/.env');

function upsertEnv(file, key, val) {
  try {
    if (!fs.existsSync(file)) return;
    let s = fs.readFileSync(file, 'utf8');
    const line = `${key}=${val}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(s)) s = s.replace(re, line); else s += (s.endsWith('\n')?'':'\n') + line + '\n';
    fs.writeFileSync(file, s);
  } catch (e) {
    console.warn('Failed to upsert env', key, 'in', file, e.message);
  }
}

let lastUrl = '';

function fetchNgrokUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const t = (j.tunnels || []).find((x) => x.public_url && x.public_url.startsWith('https://'));
          if (!t) return reject(new Error('No https ngrok tunnel'));
          resolve(t.public_url);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

async function sync(url, phoneArg) {
  if (url === lastUrl) return;
  lastUrl = url;
  console.log('🔄 Detected ngrok URL:', url);
  // Update envs
  upsertEnv(WEBSOCKET_ENV_PATH, 'PUBLIC_URL', url);
  const wssBase = url.replace(/^http/, 'ws').replace(/^https/, 'wss');
  upsertEnv(WEBSOCKET_ENV_PATH, 'WS_PUBLIC_URL', wssBase);
  // Update ALLOWED_ORIGIN based on webapp env or default
  try {
    const text = fs.readFileSync(WEBAPP_ENV_PATH, 'utf8');
    const m = text.match(/^PUBLIC_URL=(.*)$/m);
    const webappOrigin = (m && m[1]) ? m[1].trim() : 'http://localhost:3000';
    upsertEnv(WEBSOCKET_ENV_PATH, 'ALLOWED_ORIGIN', webappOrigin);
  } catch {
    upsertEnv(WEBSOCKET_ENV_PATH, 'ALLOWED_ORIGIN', 'http://localhost:3000');
  }
  try {
    const { host } = new URL(url);
    upsertEnv(WEBAPP_ENV_PATH, 'NEXT_PUBLIC_WEBSOCKET_URL', `wss://${host}/logs`);
    upsertEnv(WEBAPP_ENV_PATH, 'BACKEND_URL', `https://${host}`);
    upsertEnv(WEBAPP_ENV_PATH, 'PUBLIC_URL', `https://${host}`);
  } catch {}
  // Update Twilio webhook
  try {
    const args = [path.join(__dirname, 'update-twilio-webhook.js')];
    if (phoneArg) args.push(phoneArg);
    const child = spawn('node', args, { stdio: 'inherit' });
    child.on('close', (code) => console.log('Twilio webhook update exited with', code));
  } catch (e) {
    console.warn('Failed to spawn update-twilio-webhook:', e.message);
  }
}

async function main() {
  const idx = process.argv.indexOf('--interval');
  const interval = idx > -1 ? parseInt(process.argv[idx + 1] || '3000', 10) : 3000;
  const phoneArg = process.argv.find((a) => /^\+\d+/.test(a));
  console.log('Watching ngrok (interval', interval, 'ms)…');
  setInterval(async () => {
    try {
      const url = await fetchNgrokUrl();
      await sync(url, phoneArg);
    } catch (e) {
      // ignore until ngrok is up
    }
  }, interval);
}

main();
