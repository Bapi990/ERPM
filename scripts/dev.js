const { spawn } = require('child_process');
const net = require('net');

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true); // Port is already in use
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function start() {
  console.log('\n🚀 Starting Odias ERP Enterprise Suite...\n');

  const isBackendRunning = await checkPort(8000);
  let backendProc = null;

  if (isBackendRunning) {
    console.log('✅ Django Backend is already active on http://127.0.0.1:8000/');
  } else {
    console.log('📦 Starting Django Backend on http://127.0.0.1:8000/ ...');
    backendProc = spawn('python', ['backend/manage.py', 'runserver', '0.0.0.0:8000'], {
      shell: true,
      stdio: 'inherit',
    });

    backendProc.on('error', (err) => {
      console.error('❌ Failed to start Django backend:', err.message);
    });
  }

  // Small delay to let Django initialize
  await new Promise((r) => setTimeout(r, 1200));

  console.log('🌐 Starting Vite Frontend on http://localhost:5173/ ...\n');
  const frontendProc = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
    shell: true,
    stdio: 'inherit',
  });

  const cleanup = () => {
    console.log('\n🛑 Shutting down Odias ERP processes...');
    if (backendProc && !backendProc.killed) {
      try {
        process.kill(backendProc.pid);
      } catch (e) {}
    }
    if (frontendProc && !frontendProc.killed) {
      try {
        process.kill(frontendProc.pid);
      } catch (e) {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start();
