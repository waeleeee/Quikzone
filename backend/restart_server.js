const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 RESTARTING BACKEND SERVER\n');

// Kill any existing node processes running server.js
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { 
  stdio: 'inherit',
  shell: true 
});

killProcess.on('close', (code) => {
  console.log('✅ Killed existing Node.js processes');
  
  // Wait a moment then start the server
  setTimeout(() => {
    console.log('🚀 Starting backend server...');
    
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
  }, 2000);
});

killProcess.on('error', (error) => {
  console.log('No existing processes to kill, starting server directly...');
  
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
}); 