// Ensures all database connections and async operations are properly closed
// to prevent Jest processes from hanging after tests complete.
// Use --detectOpenHandles to identify any remaining open handles during development.

module.exports = async () => {
  console.log('[Jest Teardown] ===== TEARDOWN START =====');
  console.log('[Jest Teardown] Closing all database connections...');

  try {
    console.log('[Jest Teardown] Requiring mongoose...');
    const mongoose = require('mongoose');
    console.log('[Jest Teardown] Mongoose required');

    const connections = mongoose.connections || [];
    console.log(`[Jest Teardown] Found ${connections.length} mongoose connection(s)`);
    let closedCount = 0;

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      console.log(`[Jest Teardown] Checking connection ${i} (readyState: ${conn?.readyState})...`);
      if (conn && conn.readyState !== 0) {
        try {
          console.log(`[Jest Teardown] Closing connection ${i}...`);
          await conn.close();
          closedCount++;
          console.log(`[Jest Teardown] Connection ${i} closed`);
        } catch (error) {
          console.log(`[Jest Teardown] Error closing connection ${i}: ${error.message}`);
        }
      } else {
        console.log(`[Jest Teardown] Connection ${i} already closed (readyState: ${conn?.readyState})`);
      }
    }

    console.log(`[Jest Teardown] Checking default connection (readyState: ${mongoose.connection.readyState})...`);
    if (mongoose.connection.readyState !== 0) {
      try {
        console.log('[Jest Teardown] Disconnecting default connection...');
        await mongoose.disconnect();
        closedCount++;
        console.log('[Jest Teardown] Default connection disconnected');
      } catch (error) {
        console.log(`[Jest Teardown] Error disconnecting default connection: ${error.message}`);
      }
    } else {
      console.log('[Jest Teardown] Default connection already closed');
    }

    if (closedCount > 0) {
      console.log(`[Jest Teardown] Closed ${closedCount} database connection(s)`);
    } else {
      console.log('[Jest Teardown] No open database connections found');
    }
  } catch (error) {
    console.log(`[Jest Teardown] Error in teardown: ${error.message}`);
    console.log('[Jest Teardown] Teardown complete (some connections may remain)');
  }

  console.log('[Jest Teardown] ===== TEARDOWN COMPLETE =====');
};

