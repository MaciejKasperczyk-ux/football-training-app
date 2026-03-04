// src/models/Player.ts
import { Schema, model, models } from "mongoose";

const CoachNoteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true }
);

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
    coachNotes: { type: [CoachNoteSchema], default: [] },
    photo: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    trainers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, unique: true, sparse: true },
    discAssignedTo: { type: String, enum: ["player", "admin"], default: "player" },
    discStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
    discArea: { type: String, enum: ["sport", "family"], required: false },
    discScores: {
      D: { type: Number, default: 0 },
      I: { type: Number, default: 0 },
      S: { type: Number, default: 0 },
      C: { type: Number, default: 0 },
    },
    discAnswers: { type: Schema.Types.Mixed, required: false },
    discCompletedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

export const Player = models.Player || model("Player", PlayerSchema);
