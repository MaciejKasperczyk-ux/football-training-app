// src/models/TestResult.ts
import { Schema, model, models } from "mongoose";

const TestResultSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    notes: { type: String, required: false },
  },
  { timestamps: true }
);

export const TestResult = models.TestResult || model("TestResult", TestResultSchema);
