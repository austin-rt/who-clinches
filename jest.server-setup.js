/**
 * Jest Global Setup - Server Lifecycle Management
 *
 * Kills any running dev server, then starts a new one with NODE_ENV=test
 * Ensures API routes see NODE_ENV=test and can bypass in-season checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVER_PID_FILE = path.join(__dirname, '.jest-server.pid');
const SERVER_URL = 'http://localhost:3000';
const MAX_WAIT_TIME = 30000; // 30 seconds
const POLL_INTERVAL = 500; // 500ms

// MongoDB Memory Server - use the helper from mongodb-memory-server.mock.ts
// We'll import it dynamically to avoid ES module issues
async function startMongoMemoryServer() {
  // Import the helper function
  const { startMongoMemoryServer: startServer } = await import(
    './__tests__/mocks/mongodb-memory-server.mock.ts'
  );
  return await startServer();
}

/**
 * Kill any running Next.js dev servers
 */
function killExistingServers() {
  console.log('[Jest Server Setup] Killing any existing dev servers...');
  try {
    // Use the existing kill script logic
    execSync("pkill -f 'next dev' || pkill -f 'npm run dev' || true", {
      stdio: 'inherit',
    });
    // Wait a bit for processes to fully terminate
    execSync('sleep 1', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors - server might not be running
  }
}

/**
 * Wait for port to be free
 */
function waitForPortFree(port, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkPort = () => {
      const server = http.createServer();
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
      server.on('error', () => {
        if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkPort, 100);
        }
      });
    };
    checkPort();
  });
}

/**
 * Wait for server to be ready
 */
function waitForServerReady(url, timeout = MAX_WAIT_TIME) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            // 200 or 404 means server is responding
            resolve(true);
          } else {
            if (Date.now() - startTime > timeout) {
              reject(new Error(`Server not ready after ${timeout}ms`));
            } else {
              setTimeout(checkServer, POLL_INTERVAL);
            }
          }
        })
        .on('error', () => {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Server not ready after ${timeout}ms`));
          } else {
            setTimeout(checkServer, POLL_INTERVAL);
          }
        });
    };

    checkServer();
  });
}

/**
 * Start dev server with NODE_ENV=test
 */
function startTestServer() {
  console.log('[Jest Server Setup] Starting dev server with NODE_ENV=test...');
  const { spawn } = require('child_process');

  // Load .env.local to get MongoDB credentials for mongodb-test.ts
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '.env.local');
  
  let envVars = {};
  if (fs.existsSync(envPath)) {
    envVars = dotenv.config({ path: envPath }).parsed || {};
  }

  // Ensure MONGODB_MEMORY_SERVER_URI and MongoDB credentials are in the environment
  const serverEnv = {
    ...process.env,
    ...envVars, // Include .env.local variables
    NODE_ENV: 'test',
    MONGODB_MEMORY_SERVER_URI: process.env.MONGODB_MEMORY_SERVER_URI,
  };

  console.log(
    `[Jest Server Setup] Starting server with MONGODB_MEMORY_SERVER_URI=${serverEnv.MONGODB_MEMORY_SERVER_URI ? 'SET' : 'NOT SET'}`
  );

  // Start server with NODE_ENV=test and memory server URI
  const serverProcess = spawn('npm', ['run', 'dev'], {
    env: serverEnv,
    stdio: 'pipe',
    shell: true,
  });

  // Store PID for teardown
  fs.writeFileSync(SERVER_PID_FILE, serverProcess.pid.toString());

  // Log server output for debugging (but don't let it block)
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // Only log important messages to avoid spam
    if (output.includes('Ready') || output.includes('error') || output.includes('Error')) {
      console.log(`[Server] ${output.trim()}`);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error(`[Server Error] ${output.trim()}`);
    }
  });

  serverProcess.on('error', (error) => {
    console.error(`[Jest Server Setup] Failed to start server: ${error.message}`);
  });

  return serverProcess.pid;
}

module.exports = async () => {
  console.log('[Jest Server Setup] Starting server lifecycle management...');

  try {
    // 1. Start MongoDB Memory Server BEFORE starting Next.js server
    // This ensures MONGODB_MEMORY_SERVER_URI is set when Next.js loads lib/mongodb.ts
    console.log('[Jest Server Setup] Starting MongoDB Memory Server...');
    const memoryServerUri = await startMongoMemoryServer();
    process.env.MONGODB_MEMORY_SERVER_URI = memoryServerUri;
    console.log(`[Jest Server Setup] MongoDB Memory Server ready at ${memoryServerUri}`);

    // 2. Kill any existing servers
    killExistingServers();

    // 3. Wait for port to be free
    console.log('[Jest Server Setup] Waiting for port 3000 to be free...');
    await waitForPortFree(3000);

    // 4. Start test server
    const pid = startTestServer();

    // 5. Wait for server to be ready
    console.log('[Jest Server Setup] Waiting for server to be ready...');
    await waitForServerReady(SERVER_URL);

    console.log(`[Jest Server Setup] Server ready at ${SERVER_URL} (PID: ${pid})`);
  } catch (error) {
    console.error(`[Jest Server Setup] Error: ${error.message}`);
    throw error;
  }
};

