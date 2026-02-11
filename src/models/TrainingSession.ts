// src/models/TrainingSession.ts
import { Schema, model, models } from "mongoose";

const TrainingEntrySchema = new Schema(
  {
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    detailId: { type: Schema.Types.ObjectId, required: false },
    volume: { type: Number, required: false },
    quality: { type: Number, min: 1, max: 5, required: false },
    notes: { type: String, required: false },
  },
  { _id: true }
);

const TrainingSessionSchema = new Schema(
  {
    // support group trainings: one session can have multiple players
    players: { type: [Schema.Types.ObjectId], ref: "Player", required: true },
    // optional assigned trainer
    trainerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, required: false },
    location: { type: String, required: false },
    goal: { type: String, required: false },
    rpe: { type: Number, min: 1, max: 10, required: false },
    notes: { type: String, required: false },
    entries: { type: [TrainingEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const TrainingSession =
  models.TrainingSession || model("TrainingSession", TrainingSessionSchema);
