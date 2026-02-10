import { Schema, model, models } from "mongoose";

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: false, trim: true },
    // references to reusable sub-skills (many-to-many)
    details: [{ type: Schema.Types.ObjectId, ref: "SubSkill" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Skill = models.Skill || model("Skill", SkillSchema);
