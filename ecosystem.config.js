module.exports = {
  apps: [
    {
      name: "novamobile-api",
      cwd: "/var/www/novamobile/app/api",
      script: "dist/src/main.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "novamobile-web",
      cwd: "/var/www/novamobile/app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1200M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
