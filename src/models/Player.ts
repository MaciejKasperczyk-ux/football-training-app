// src/models/Player.ts
import { Schema, model, models } from "mongoose";

const PlayerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: false },
    age: { type: Number, required: false },
    club: { type: String, required: false, trim: true },
    position: { type: String, required: false, trim: true },
    dominantFoot: { type: String, enum: ["left", "right", "both"], required: false },
    notes: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    trainers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Player = models.Player || model("Player", PlayerSchema);
