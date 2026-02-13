// src/models/User.ts
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "trainer", "viewer", "player"], default: "trainer" },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: false, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    hasPasswordChanged: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
