require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const User = require('../models/User');
const v = require('../validation');
const { hashPassword } = require('../password');
async function main() {
  if (!process.env.MONGO_URI) throw new Error('Copy .env.example to .env first.');
  const rl = readline.createInterface({ input: stdin, output: stdout });
  let name, email, password;
  try {
    name = v.text(await rl.question('Admin name: '), 'Name', 2, 80);
    email = v.email(await rl.question('Admin email: '));
    console.log('Use a unique password. Input is visible in this local terminal.');
    password = v.password(await rl.question('Admin password (10–128 characters): '));
    if (password !== await rl.question('Confirm password: ')) throw new Error('Passwords do not match.');
  } finally { rl.close(); }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await User.init();
  if (await User.exists({ email })) throw new Error('Email already exists. Use a separate new admin email.');
  await User.create({ name, email, passwordHash: await hashPassword(password), role: 'admin' });
  console.log('Administrator created. You can sign in through the website.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
