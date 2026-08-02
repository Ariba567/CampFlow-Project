import mongoose from "mongoose";
import { connectDB } from "../config/db";
import User from "../models/User";
import { hashPassword } from "../utils/password";

const testAccounts = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@campflow.test",
    password: "TestAdmin123!",
    role: "admin" as const,
  },
  {
    firstName: "Manager",
    lastName: "User",
    email: "manager@campflow.test",
    password: "TestManager123!",
    role: "manager" as const,
  },
];

async function seedTestAccounts() {
  await connectDB();

  for (const account of testAccounts) {
    const existing = await User.findOne({ email: account.email }).select("_id").lean();
    if (existing) {
      console.log(`${account.email} already exists, skipped`);
      continue;
    }

    await User.create({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      password: await hashPassword(account.password),
      role: account.role,
      isActive: true,
    });
    console.log(`Created test ${account.role}: ${account.email}`);
  }
}

seedTestAccounts()
  .catch((error: unknown) => {
    console.error("Failed to seed test accounts:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
