import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI");
}

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "trainer", "viewer"], default: "trainer" },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;
const name = process.env.SEED_NAME ?? "Trainer";
const role = process.env.SEED_ROLE ?? "trainer";

if (!email || !password) {
  throw new Error("SEED_EMAIL and SEED_PASSWORD are required");
}

await mongoose.connect(uri);

const exists = await User.findOne({ email }).lean();
if (exists) {
  console.log("User already exists:", email);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);
await User.create({ email, name, role, passwordHash });

console.log("Created user:", email, "role:", role);
process.exit(0);
