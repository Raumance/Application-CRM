module.exports = {
  apps: [
    {
      name: 'crm-carwazplan-backend',
      script: './src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 4000,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/carwazplan_crm',
        JWT_SECRET: 'changez-moi-en-production-avec-une-cle-secrete-longue-et-complexe',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
