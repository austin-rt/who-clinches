const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');
const { waitForPortFree, waitForServerReady } = require('./server-utils');

let serverProcess = null;
let serverPid = null;
let pidFile = null;

const DEFAULT_PORT = 3000;
const DEFAULT_URL = 'http://localhost:3000';
const MAX_WAIT_TIME = 30000;
const POLL_INTERVAL = 500;

function killExistingServers() {
  console.log('[Next.js Dev Server] killExistingServers() called');
  try {
    console.log('[Next.js Dev Server] Killing existing dev servers...');
    execSync("pkill -f 'next dev' || pkill -f 'npm run dev' || true", {
      stdio: 'inherit',
    });
    console.log('[Next.js Dev Server] Waiting 1 second...');
    execSync('sleep 1', { stdio: 'ignore' });
    console.log('[Next.js Dev Server] killExistingServers() complete');
  } catch (error) {
    console.log(
      `[Next.js Dev Server] Error killing servers (may not be running): ${error.message}`
    );
  }
}

async function isNextDevRunning(url = DEFAULT_URL) {
  console.log(`[Next.js Dev Server] isNextDevRunning() called, checking ${url}...`);
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      const isRunning = res.statusCode === 200 || res.statusCode === 404;
      console.log(
        `[Next.js Dev Server] Server check result: ${isRunning} (status: ${res.statusCode})`
      );
      resolve(isRunning);
    });
    req.on('error', (error) => {
      console.log(`[Next.js Dev Server] Server check error: ${error.message}`);
      resolve(false);
    });
    req.setTimeout(2000, () => {
      console.log('[Next.js Dev Server] Server check timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function startNextDevServer(options = {}) {
  console.log('[Next.js Dev Server] startNextDevServer() called');
  const {
    port = DEFAULT_PORT,
    url = DEFAULT_URL,
    env = {},
    nodeEnv,
    pidFile: customPidFile,
    waitForReady = true,
    timeout = MAX_WAIT_TIME,
    killExisting = false,
    logPrefix = '[Next.js Dev Server]',
  } = options;

  console.log(
    `[Next.js Dev Server] Options: port=${port}, url=${url}, killExisting=${killExisting}, waitForReady=${waitForReady}`
  );

  if (killExisting) {
    console.log(`${logPrefix} Killing any existing dev servers...`);
    killExistingServers();
    console.log(`${logPrefix} Waiting for port ${port} to be free...`);
    await waitForPortFree(port);
    console.log(`${logPrefix} Port ${port} is free`);
  } else {
    console.log(`${logPrefix} Checking if server is already running...`);
    const isAlreadyRunning = await isNextDevRunning(url);
    if (isAlreadyRunning) {
      console.log(`${logPrefix} Server already running, returning early`);
      return {
        isRunning: true,
        wasAlreadyRunning: true,
        pid: null,
      };
    }
    console.log(`${logPrefix} Server not running, will start new one`);
  }

  console.log('[Next.js Dev Server] Loading environment variables...');
  const envPath = path.join(process.cwd(), '.env.local');
  let envVars = {};
  if (fs.existsSync(envPath)) {
    console.log('[Next.js Dev Server] .env.local found, loading...');
    envVars = dotenv.config({ path: envPath }).parsed || {};
    console.log(
      `[Next.js Dev Server] Loaded ${Object.keys(envVars).length} env vars from .env.local`
    );
  } else {
    console.log('[Next.js Dev Server] .env.local not found');
  }

  const serverEnv = {
    ...process.env,
    ...envVars,
    ...env,
  };

  if (nodeEnv) {
    serverEnv.NODE_ENV = nodeEnv;
    console.log(`[Next.js Dev Server] NODE_ENV set to ${nodeEnv}`);
  }

  console.log(`${logPrefix} Starting dev server...`);
  console.log(`[Next.js Dev Server] Spawning npm run dev process...`);

  serverProcess = spawn('npm', ['run', 'dev'], {
    env: serverEnv,
    stdio: 'pipe',
    shell: true,
  });

  serverPid = serverProcess.pid || null;
  console.log(`[Next.js Dev Server] Server process spawned, PID: ${serverPid}`);

  if (serverPid && customPidFile) {
    pidFile = customPidFile;
    try {
      fs.writeFileSync(pidFile, serverPid.toString());
      console.log(`[Next.js Dev Server] PID written to ${pidFile}`);
    } catch (error) {
      console.log(`[Next.js Dev Server] Error writing PID file: ${error.message}`);
    }
  }

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('error') || output.includes('Error')) {
      console.log(`[Server] ${output.trim()}`);
    }
  });

  serverProcess.stderr?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error(`[Server Error] ${output.trim()}`);
    }
  });

  serverProcess.on('error', (error) => {
    console.error(`${logPrefix} Failed to start: ${error.message}`);
    serverProcess = null;
    serverPid = null;
  });

  if (waitForReady && serverPid) {
    console.log(`[Next.js Dev Server] Waiting for server to be ready (timeout: ${timeout}ms)...`);
    try {
      await waitForServerReady(url, timeout, POLL_INTERVAL);
      console.log(`[Next.js Dev Server] Server is ready`);
    } catch (error) {
      console.error(`${logPrefix} Server did not become ready: ${error.message}`);
      throw error;
    }
  } else {
    console.log(
      `[Next.js Dev Server] Not waiting for server ready (waitForReady=${waitForReady}, pid=${serverPid})`
    );
  }

  console.log(`[Next.js Dev Server] startNextDevServer() complete, returning result`);
  return {
    isRunning: true,
    wasAlreadyRunning: false,
    pid: serverPid,
  };
}

async function stopNextDevServer(options = {}) {
  const stopStartTime = Date.now();
  console.log('[Next.js Dev Server] stopNextDevServer() called');
  const { pidFile: customPidFile, logPrefix = '[Next.js Dev Server]' } = options;

  const fileToUse = customPidFile || pidFile;
  console.log(`[Next.js Dev Server] Using PID file: ${fileToUse}`);

  if (!fileToUse || !fs.existsSync(fileToUse)) {
    console.log('[Next.js Dev Server] PID file not found, skipping file-based kill');
  } else {
    try {
      console.log('[Next.js Dev Server] Reading PID from file...');
      const storedPid = parseInt(fs.readFileSync(fileToUse, 'utf8').trim(), 10);
      console.log(`[Next.js Dev Server] Stored PID: ${storedPid}`);
      if (storedPid && !isNaN(storedPid)) {
        console.log(`${logPrefix} Killing server process ${storedPid}...`);
        try {
          console.log(`[Next.js Dev Server] Sending SIGTERM to ${storedPid}...`);
          process.kill(storedPid, 'SIGTERM');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('[Next.js Dev Server] Waiting 1 second after SIGTERM...');
          try {
            process.kill(storedPid, 0);
            console.log(
              `[Next.js Dev Server] Process still alive, sending SIGKILL to ${storedPid}...`
            );
            process.kill(storedPid, 'SIGKILL');
          } catch {
            console.log('[Next.js Dev Server] Process already dead after SIGTERM');
          }
        } catch (error) {
          console.log(`[Next.js Dev Server] Error with SIGTERM, trying SIGKILL: ${error.message}`);
          try {
            process.kill(storedPid, 'SIGKILL');
            console.log(`[Next.js Dev Server] SIGKILL sent to ${storedPid}`);
          } catch (killError) {
            console.log(`[Next.js Dev Server] Process already dead: ${killError.message}`);
          }
        }
        console.log('[Next.js Dev Server] Calling killExistingServers()...');
        killExistingServers();
      }
      console.log('[Next.js Dev Server] Deleting PID file...');
      fs.unlinkSync(fileToUse);
      console.log('[Next.js Dev Server] PID file deleted');
    } catch (error) {
      console.log(`[Next.js Dev Server] Error stopping server from PID file: ${error.message}`);
    }
  }

  if (serverProcess) {
    console.log('[Next.js Dev Server] Killing serverProcess directly...');
    try {
      serverProcess.kill('SIGTERM');
      console.log('[Next.js Dev Server] SIGTERM sent to serverProcess');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('[Next.js Dev Server] Waiting 1 second after SIGTERM...');
    } catch (error) {
      console.log(`[Next.js Dev Server] Error with SIGTERM on serverProcess: ${error.message}`);
      try {
        serverProcess.kill('SIGKILL');
        console.log('[Next.js Dev Server] SIGKILL sent to serverProcess');
      } catch (killError) {
        console.log(`[Next.js Dev Server] Process already dead: ${killError.message}`);
      }
    }
    serverProcess = null;
    console.log('[Next.js Dev Server] serverProcess cleared');
  } else {
    console.log('[Next.js Dev Server] No serverProcess to kill');
  }

  serverPid = null;
  pidFile = null;
  const stopTime = Date.now() - stopStartTime;
  console.log(`[Next.js Dev Server] stopNextDevServer() complete (took ${stopTime}ms)`);
}

module.exports = {
  isNextDevRunning,
  startNextDevServer,
  stopNextDevServer,
  waitForPortFree,
  waitForServerReady,
  killExistingServers,
};
