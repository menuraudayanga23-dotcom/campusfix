require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
async function start() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Copy .env.example to .env first.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  // Ensure unique email/session indexes before accepting traffic.
  await Promise.all([require('./models/User').init(), require('./models/Session').init()]);
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || '127.0.0.1';
  const server = app.listen(port, host, () => {
    console.log('MongoDB connected.');
    console.log(`CampusFix: ${process.env.APP_ORIGIN || `http://localhost:${port}`}`);
  });
  server.on('error', error => { console.error(error.message); mongoose.disconnect().finally(() => process.exit(1)); });
  const stop = () => server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
start().catch(error => { console.error(`Startup failed: ${error.message}`); process.exit(1); });
