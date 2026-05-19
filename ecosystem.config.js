module.exports = {
  apps: [{
    name: 'space-invaders',
    script: 'npm',
    args: 'start -- -p 3015',
    cwd: '/home/gelt/apps/space-invaders',
    env: {
      NODE_ENV: 'production',
      PORT: 3015,
    },
  }],
}
