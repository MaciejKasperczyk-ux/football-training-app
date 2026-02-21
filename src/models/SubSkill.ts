import { Schema, model, models } from "mongoose";

const SubSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    difficulty: { type: Number, enum: [1, 2, 3], default: 1, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubSkill = models.SubSkill || model("SubSkill", SubSkillSchema);
