import { z } from "zod";
import { birthDate, gender } from "@/features/profile";

export const passengerInput = z.object({
  chapterId: z.string().min(1).max(64),
  managedByUserId: z.string().min(1).max(64),
  userId: z.string().min(1).max(64).nullish(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate,
  gender,
});
export type PassengerInput = z.infer<typeof passengerInput>;

/** What a rider's own people may change: a name, a birthday, a gender. Not the
 *  chapter — moving between chapters is leaving one, not editing a field. */
export const passengerDetails = passengerInput.pick({
  firstName: true,
  lastName: true,
  birthDate: true,
  gender: true,
});
export type PassengerDetailsInput = z.infer<typeof passengerDetails>;
