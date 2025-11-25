/**
 * Jest Global Teardown - Server Lifecycle Management
 *
 * Kills the test server that was started in jest.server-setup.js
 */

const path = require('path');
const { stopNextDevServer, waitForPortFree } = require('./lib/helpers/nextjs-dev-server');

const SERVER_PID_FILE = path.join(__dirname, '.jest-server.pid');
const SERVER_PORT = 3000;

// MongoDB Memory Server - stop it via the helper
async function stopMongoMemoryServer() {
  console.log('[Jest Server Teardown] stopMongoMemoryServer() called');
  try {
    // Import the helper function to properly stop the memory server
    console.log('[Jest Server Teardown] Importing mongodb-memory-server.mock...');
    const { stopMongoMemoryServer: stopServer } = await import(
      './__tests__/mocks/mongodb-memory-server.mock.ts'
    );
    console.log('[Jest Server Teardown] Calling stopServer() from mock...');
    await stopServer();
    console.log('[Jest Server Teardown] stopMongoMemoryServer() complete');
  } catch (error) {
    console.log(`[Jest Server Teardown] Error in stopMongoMemoryServer helper: ${error.message}`);
    // If helper fails, try to disconnect mongoose directly
    try {
      console.log('[Jest Server Teardown] Falling back to direct mongoose disconnect...');
      const mongoose = await import('mongoose');
      
      // Close all mongoose connections
      const connections = mongoose.default.connections || [];
      console.log(`[Jest Server Teardown] Found ${connections.length} mongoose connections`);
      for (const conn of connections) {
        if (conn && conn.readyState !== 0) {
          try {
            console.log(`[Jest Server Teardown] Closing connection (readyState: ${conn.readyState})...`);
            await conn.close();
            console.log('[Jest Server Teardown] Connection closed');
          } catch (closeError) {
            console.log(`[Jest Server Teardown] Error closing connection: ${closeError.message}`);
            // Ignore errors for individual connections
          }
        }
      }
      
      // Disconnect default mongoose connection
      if (mongoose.default.connection.readyState !== 0) {
        console.log(`[Jest Server Teardown] Disconnecting default connection (readyState: ${mongoose.default.connection.readyState})...`);
        await mongoose.default.disconnect();
        console.log('[Jest Server Teardown] Default connection disconnected');
      }
    } catch (disconnectError) {
      console.log(`[Jest Server Teardown] Error closing MongoDB connections: ${disconnectError.message}`);
      console.log('[Jest Server Teardown] Will clean up on exit');
    }
  }
}


module.exports = async () => {
  console.log('[Jest Server Teardown] ===== GLOBAL TEARDOWN START =====');
  console.log('[Jest Server Teardown] Starting teardown...');
  const teardownStartTime = Date.now();

  try {
    // 1. Stop MongoDB Memory Server
    console.log('[Jest Server Teardown] Step 1: Stopping MongoDB Memory Server...');
    const step1Start = Date.now();
    await Promise.race([
      stopMongoMemoryServer(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Step 1 timeout after 5s'));
        }, 5000);
      }),
    ]);
    console.log(`[Jest Server Teardown] Step 1: MongoDB Memory Server stopped (took ${Date.now() - step1Start}ms)`);
    delete process.env.MONGODB_MEMORY_SERVER_URI;
    console.log('[Jest Server Teardown] Step 1: MONGODB_MEMORY_SERVER_URI environment variable deleted');

    // 2. Run database teardown (from jest.teardown.js)
    console.log('[Jest Server Teardown] Step 2: Running database teardown...');
    const step2Start = Date.now();
    const dbTeardown = require('./jest.teardown.js');
    await Promise.race([
      dbTeardown(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Step 2 timeout after 5s'));
        }, 5000);
      }),
    ]);
    console.log(`[Jest Server Teardown] Step 2: Database teardown complete (took ${Date.now() - step2Start}ms)`);

    // 3. Stop the Next.js dev server (only if we started it)
    console.log('[Jest Server Teardown] Step 3: Stopping test server...');
    const step3Start = Date.now();
    await Promise.race([
      stopNextDevServer({
        pidFile: SERVER_PID_FILE,
        logPrefix: '[Jest Server Teardown]',
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Step 3 timeout after 10s'));
        }, 10000);
      }),
    ]);
    console.log(`[Jest Server Teardown] Step 3: Test server stopped (took ${Date.now() - step3Start}ms)`);

    // 5. Wait for port to be free (with short timeout to avoid hanging)
    console.log('[Jest Server Teardown] Step 4: Waiting for port 3000 to be free (timeout: 3s)...');
    const step4Start = Date.now();
    const portFree = await Promise.race([
      waitForPortFree(SERVER_PORT, 3000),
      new Promise((resolve) => {
        setTimeout(() => {
          console.log('[Jest Server Teardown] Step 4: Port check timeout, continuing anyway');
          resolve(false);
        }, 3000);
      }),
    ]);
    console.log(`[Jest Server Teardown] Step 4: Port check complete (result: ${portFree}, took ${Date.now() - step4Start}ms)`);

    const totalTime = Date.now() - teardownStartTime;
    console.log(`[Jest Server Teardown] ===== GLOBAL TEARDOWN COMPLETE (total: ${totalTime}ms) =====`);
  } catch (error) {
    const totalTime = Date.now() - teardownStartTime;
    console.error(`[Jest Server Teardown] ===== GLOBAL TEARDOWN ERROR (after ${totalTime}ms) =====`);
    console.error(`[Jest Server Teardown] Error: ${error.message}`);
    console.error(`[Jest Server Teardown] Stack: ${error.stack}`);
    // Don't throw - teardown should always complete
  }
};

