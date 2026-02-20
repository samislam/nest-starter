// This file is used by pm2 for deployment
module.exports = {
  apps: [
    {
      name: 'nest-starter',
      script: 'dist/scripts/start.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
    },
  ],
}
