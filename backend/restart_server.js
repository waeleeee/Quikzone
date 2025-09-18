const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server to apply new agency filtering changes...');

// Kill any existing node processes running server.js
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { 
  stdio: 'inherit',
  shell: true 
});

killProcess.on('close', (code) => {
  console.log('✅ Killed existing Node.js processes');
  
  // Start the server again
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Error starting server:', error);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  console.log('🚀 Server restarted successfully!');
  console.log('🔧 New agency filtering is now active');
  console.log('📝 You can now test creating pickup missions');
});

killProcess.on('error', (error) => {
  console.error('❌ Error killing processes:', error);
}); 