const http = require('http');

function waitForPortFree(port, timeout = 5000) {
  console.log(`[Server Utils] waitForPortFree() called, port=${port}, timeout=${timeout}ms`);
  return new Promise((resolve) => {
    const startTime = Date.now();
    let timeoutId = null;
    let checkCount = 0;
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    const checkPort = () => {
      checkCount++;
      const elapsed = Date.now() - startTime;
      console.log(`[Server Utils] Checking if port ${port} is free (attempt ${checkCount}, elapsed: ${elapsed}ms)...`);
      
      if (elapsed > timeout) {
        console.log(`[Server Utils] TIMEOUT: Port ${port} check exceeded ${timeout}ms, resolving false`);
        cleanup();
        resolve(false);
        return;
      }
      
      const server = http.createServer();
      let resolved = false;
      
      const resolveOnce = (value) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(value);
        }
      };
      
      server.listen(port, () => {
        console.log(`[Server Utils] Port ${port} is free (elapsed: ${Date.now() - startTime}ms)`);
        server.close(() => {
          console.log(`[Server Utils] Test server closed, port ${port} confirmed free`);
          resolveOnce(true);
        });
      });
      
      server.on('error', (error) => {
        const elapsed = Date.now() - startTime;
        console.log(`[Server Utils] Port ${port} check error: ${error.message}, elapsed: ${elapsed}ms`);
        if (elapsed > timeout) {
          console.log(`[Server Utils] TIMEOUT: Port ${port} check exceeded ${timeout}ms, resolving false`);
          resolveOnce(false);
        } else {
          console.log(`[Server Utils] Will retry in 100ms...`);
          timeoutId = setTimeout(checkPort, 100);
        }
      });
      
      // Safety timeout
      timeoutId = setTimeout(() => {
        console.log(`[Server Utils] SAFETY TIMEOUT: Port ${port} check exceeded ${timeout}ms`);
        resolveOnce(false);
      }, timeout);
    };
    
    checkPort();
  });
}

function waitForServerReady(url, timeout = 30000, pollInterval = 500) {
  console.log(`[Server Utils] waitForServerReady() called, url=${url}, timeout=${timeout}ms, pollInterval=${pollInterval}ms`);
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = () => {
      const elapsed = Date.now() - startTime;
      console.log(`[Server Utils] Checking if server is ready (elapsed: ${elapsed}ms)...`);
      http
        .get(url, (res) => {
          console.log(`[Server Utils] Server responded with status ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 404) {
            console.log(`[Server Utils] Server is ready!`);
            resolve(true);
          } else {
            if (elapsed > timeout) {
              console.log(`[Server Utils] Timeout waiting for server to be ready`);
              reject(new Error(`Server not ready after ${timeout}ms`));
            } else {
              console.log(`[Server Utils] Server not ready yet, will check again in ${pollInterval}ms`);
              setTimeout(checkServer, pollInterval);
            }
          }
        })
        .on('error', (error) => {
          const elapsed = Date.now() - startTime;
          console.log(`[Server Utils] Server check error: ${error.message}, elapsed: ${elapsed}ms`);
          if (elapsed > timeout) {
            console.log(`[Server Utils] Timeout waiting for server to be ready`);
            reject(new Error(`Server not ready after ${timeout}ms`));
          } else {
            console.log(`[Server Utils] Will check again in ${pollInterval}ms`);
            setTimeout(checkServer, pollInterval);
          }
        });
    };

    checkServer();
  });
}

module.exports = {
  waitForPortFree,
  waitForServerReady,
};


