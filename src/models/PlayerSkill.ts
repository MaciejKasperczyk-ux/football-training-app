import { Schema, model, models } from "mongoose";

const PlayerSkillSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
    detailId: { type: Schema.Types.ObjectId, required: false },

    plannedDate: { type: Date, required: false },
    doneDate: { type: Date, required: false },

    status: { type: String, enum: ["plan", "w_trakcie", "zrobione"], default: "plan" },

    notes: { type: String, required: false },
  },
  { timestamps: true }
);

PlayerSkillSchema.index({ playerId: 1, skillId: 1, detailId: 1 }, { unique: true });

export const PlayerSkill = models.PlayerSkill || model("PlayerSkill", PlayerSkillSchema);
