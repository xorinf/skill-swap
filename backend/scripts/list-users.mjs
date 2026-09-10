// List all user emails so we know what to log in with.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

const main = async () => {
  await connectDB();
  const users = await User.find({}, 'name email department year trustScore timeCredits').lean();
  console.log(`\n${users.length} users:\n`);
  for (const u of users) {
    console.log(`  ${u.email.padEnd(36)} ${u.name.padEnd(20)} ${u.department}/${u.year}  trust=${u.trustScore}  credits=${u.timeCredits}`);
  }
  await mongoose.disconnect();
};
main().catch((e) => { console.error(e); process.exit(1); });
