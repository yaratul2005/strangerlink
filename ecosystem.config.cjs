module.exports = {
  apps: [
    {
      name: "web-app",
      // Bun only auto-loads .env from its cwd — run from the repo root so the
      // root .env (DATABASE_URL etc.) reaches the server on every spawn.
      cwd: __dirname,
      script: "packages/web/src/server.ts",
      interpreter: "bun",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 1000,
      env: {
        PORT: process.env.PORT || 4200,
      },
    },
    {
      name: "signal-server",
      cwd: __dirname,
      script: "packages/web/src/signal/server.ts",
      interpreter: "bun",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 1000,
      env: {
        SIGNAL_PORT: process.env.SIGNAL_PORT || 4201,
      },
    },
  ],
};
