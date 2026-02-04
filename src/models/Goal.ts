import { Schema, model, models } from "mongoose";

const GoalSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["planned", "in_progress", "done"], default: "planned" },

    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: false },
    detailId: { type: Schema.Types.ObjectId, required: false },

    createdByUserId: { type: String, required: false },
  },
  { timestamps: true }
);

export const Goal = models.Goal || model("Goal", GoalSchema);
