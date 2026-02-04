import { Schema, model, models } from "mongoose";

const SkillDetailSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: false, trim: true },
    details: { type: [SkillDetailSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Skill = models.Skill || model("Skill", SkillSchema);
