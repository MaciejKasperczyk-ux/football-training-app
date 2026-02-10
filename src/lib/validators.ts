// src/lib/validators.ts
import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "trainer", "viewer"]).optional(),
  password: z.string().min(8),
});

export const playerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional(),
  age: z.number().int().positive().optional(),
  club: z.string().optional(),
  position: z.string().optional(),
  dominantFoot: z.enum(["left", "right", "both"]).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  details: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export const trainingSchema = z.object({
  playerId: z.string().min(1),
  date: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  goal: z.string().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  entries: z
    .array(
      z.object({
        skillId: z.string().min(1),
        detailId: z.string().optional(),
        volume: z.number().int().positive().optional(),
        quality: z.number().int().min(1).max(5).optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});
