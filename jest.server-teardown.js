/**
 * Jest Global Teardown - Server Lifecycle Management
 *
 * Kills the test server that was started in jest.server-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVER_PID_FILE = path.join(__dirname, '.jest-server.pid');
const SERVER_PORT = 3000;

// MongoDB Memory Server - stop it via the helper
async function stopMongoMemoryServer() {
  try {
    // Import the helper function to properly stop the memory server
    const { stopMongoMemoryServer: stopServer } = await import(
      './__tests__/mocks/mongodb-memory-server.mock.ts'
    );
    await stopServer();
  } catch (error) {
    // If helper fails, try to disconnect mongoose directly
    try {
      const mongoose = await import('mongoose');
      
      // Close all mongoose connections
      const connections = mongoose.default.connections || [];
      for (const conn of connections) {
        if (conn && conn.readyState !== 0) {
          try {
            await conn.close();
          } catch {
            // Ignore errors for individual connections
          }
        }
      }
      
      // Disconnect default mongoose connection
      if (mongoose.default.connection.readyState !== 0) {
        await mongoose.default.disconnect();
      }
    } catch (mongooseError) {
      console.log('[Jest Server Teardown] Error closing MongoDB connections (will clean up on exit)');
    }
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

module.exports = async () => {
  console.log('[Jest Server Teardown] Starting teardown...');

  try {
    // 1. Stop MongoDB Memory Server
    console.log('[Jest Server Teardown] Stopping MongoDB Memory Server...');
    await stopMongoMemoryServer();
    delete process.env.MONGODB_MEMORY_SERVER_URI;

    // 2. Run database teardown (from jest.teardown.js)
    console.log('[Jest Server Teardown] Closing database connections...');
    const dbTeardown = require('./jest.teardown.js');
    await dbTeardown();

    // 3. Then kill the test server
    console.log('[Jest Server Teardown] Stopping test server...');

    // Try to kill by PID if file exists
    if (fs.existsSync(SERVER_PID_FILE)) {
      try {
        const pid = parseInt(fs.readFileSync(SERVER_PID_FILE, 'utf8').trim(), 10);
        if (pid && !isNaN(pid)) {
          console.log(`[Jest Server Teardown] Killing server process ${pid}...`);
          try {
            process.kill(pid, 'SIGTERM');
            // Wait a bit for graceful shutdown
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            // Process might already be dead, try SIGKILL
            try {
              process.kill(pid, 'SIGKILL');
            } catch {
              // Ignore - process is already dead
            }
          }
        }
      } catch (error) {
        // Ignore errors reading PID file
      }
      // Clean up PID file
      try {
        fs.unlinkSync(SERVER_PID_FILE);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // 4. Safety net: kill any remaining next dev processes
    console.log('[Jest Server Teardown] Cleaning up any remaining dev server processes...');
    try {
      execSync("pkill -f 'next dev' || pkill -f 'npm run dev' || true", {
        stdio: 'ignore',
      });
    } catch {
      // Ignore errors
    }

    // 5. Wait for port to be free
    console.log('[Jest Server Teardown] Waiting for port 3000 to be free...');
    await waitForPortFree(SERVER_PORT);

    console.log('[Jest Server Teardown] Teardown complete');
  } catch (error) {
    console.error(`[Jest Server Teardown] Error: ${error.message}`);
    // Don't throw - teardown should always complete
  }
};

