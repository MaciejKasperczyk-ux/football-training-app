import { Schema, model, models } from "mongoose";

const SubSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubSkill = models.SubSkill || model("SubSkill", SubSkillSchema);
