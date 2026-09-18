import { updateManagedPassenger } from "./facade";
import { updatePassengerManagedBy } from "./services/passengers";

jest.mock("./services/passengers", () => ({
  countPassengersManagedBy: jest.fn(),
  findPassengerOfUser: jest.fn(),
  findPassengersManagedBy: jest.fn(),
  findPassengersOfChapters: jest.fn(),
  insertPassenger: jest.fn(),
  updatePassengerManagedBy: jest.fn(),
  upsertOwnPassenger: jest.fn(),
}));

const update = updatePassengerManagedBy as jest.Mock;

const details = {
  firstName: "Ida",
  lastName: "Hansen",
  birthDate: new Date("1939-04-02"),
  gender: "female" as const,
};

beforeEach(() => jest.clearAllMocks());

it("scopes the write to the account that manages the rider", async () => {
  update.mockResolvedValue(1);

  await updateManagedPassenger("p1", "u1", details);

  expect(update).toHaveBeenCalledWith("p1", "u1", details);
});

it("reports a rider that is not this account's as not written", async () => {
  update.mockResolvedValue(0);

  await expect(updateManagedPassenger("p1", "stranger", details)).resolves.toBe(
    false,
  );
});
