/**
 * Jest Global Teardown
 *
 * Ensures all database connections and async operations are properly closed
 * to prevent Jest processes from hanging after tests complete.
 *
 * Use --detectOpenHandles to identify any remaining open handles during development.
 */

module.exports = async () => {
  console.log('[Jest Teardown] Closing all database connections...');

  try {
    const mongoose = require('mongoose');

    // Close all mongoose connections
    const connections = mongoose.connections || [];
    let closedCount = 0;

    for (const conn of connections) {
      if (conn && conn.readyState !== 0) {
        try {
          await conn.close();
          closedCount++;
        } catch {
          // Ignore errors for individual connections
        }
      }
    }

    // Also close the default connection if it's still open
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        closedCount++;
      } catch {
        // Ignore errors
      }
    }

    if (closedCount > 0) {
      console.log(`[Jest Teardown] Closed ${closedCount} database connection(s)`);
    } else {
      console.log('[Jest Teardown] No open database connections found');
    }
  } catch {
    // Ignore errors - forceExit will handle termination
    console.log('[Jest Teardown] Teardown complete (some connections may remain)');
  }

  console.log('[Jest Teardown] Teardown complete');
};

