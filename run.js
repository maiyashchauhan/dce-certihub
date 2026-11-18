const { spawn } = require('child_process');

console.log('\n===============================================');
console.log('🚀 Launching DCE CertiHub (Backend + Frontend)...');
console.log('🌐 Frontend: http://localhost:3000');
console.log('⚙️  Backend:  http://localhost:5000');
console.log('===============================================\n');

// Start backend (with --watch so edits auto-reload instantly)
const server = spawn('node', ['--watch', 'server/server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// Start client Vite dev server
const client = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: `${__dirname}/client`
});

const cleanup = () => {
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
