// src/models/Test.ts
import { Schema, model, models } from "mongoose";

const TestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, required: false, trim: true },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

export const Test = models.Test || model("Test", TestSchema);
