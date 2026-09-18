import { prisma } from "@/lib/prisma";
import type { Prisma, RideRequestStatus } from "@/generated/prisma";

const forPassenger = {
  id: true,
  chapterId: true,
  passengerId: true,
  requestedByUserId: true,
  preferredDate: true,
  timeOfDay: true,
  note: true,
  status: true,
  cancelledAt: true,
  decidedAt: true,
  declineReason: true,
  createdAt: true,
  chapter: { select: { name: true, city: true } },
  passenger: { select: { firstName: true, lastName: true } },
} satisfies Prisma.RideRequestSelect;

export const insertRideRequest = (
  data: Prisma.RideRequestUncheckedCreateInput,
) => prisma.rideRequest.create({ data });

export const findRideRequestById = (id: string) =>
  prisma.rideRequest.findUnique({ where: { id } });

export const findRideRequestsOfPassengers = (passengerIds: string[]) =>
  prisma.rideRequest.findMany({
    where: { passengerId: { in: passengerIds } },
    orderBy: [{ preferredDate: "desc" }, { createdAt: "desc" }],
    select: forPassenger,
  });

export const findOpenRideRequestOn = (
  passengerId: string,
  preferredDate: Date,
  statuses: readonly RideRequestStatus[],
) =>
  prisma.rideRequest.findFirst({
    where: {
      passengerId,
      preferredDate,
      status: { in: [...statuses] },
    },
    select: { id: true },
  });

export const findRideRequestsOfChapters = (chapterIds: string[]) =>
  prisma.rideRequest.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: [{ preferredDate: "asc" }, { createdAt: "asc" }],
    select: {
      ...forPassenger,
      requestedBy: { select: { email: true, phoneNumber: true } },
    },
  });

export const updateRideRequestStatus = (
  id: string,
  status: RideRequestStatus,
  cancelledAt: Date | null,
) =>
  prisma.rideRequest.update({ where: { id }, data: { status, cancelledAt } });

export const updateRideRequestDecision = (
  id: string,
  data: {
    status: RideRequestStatus;
    decidedAt: Date;
    decidedByUserId: string | null;
    declineReason: string | null;
  },
) => prisma.rideRequest.update({ where: { id }, data });
