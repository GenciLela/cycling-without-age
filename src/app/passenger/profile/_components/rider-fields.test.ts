import {
  displayValue,
  hasChanged,
  isComplete,
  normalise,
  type RiderValues,
} from "./rider-fields";

const GENDERS = { female: "Frau", male: "Mann", other: "Divers" };

const ida: RiderValues = {
  firstName: "Ida",
  lastName: "Hansen",
  birthDate: "1939-04-02",
  gender: "female",
};

describe("isComplete", () => {
  it("accepts a filled-in rider", () => {
    expect(isComplete(ida)).toBe(true);
  });

  it("refuses a name that is only spaces", () => {
    expect(isComplete({ ...ida, firstName: "   " })).toBe(false);
  });

  it("refuses a cleared birth date", () => {
    expect(isComplete({ ...ida, birthDate: "" })).toBe(false);
  });
});

describe("hasChanged", () => {
  it("sees a real edit", () => {
    expect(hasChanged({ ...ida, lastName: "Hansen-Vogt" }, ida)).toBe(true);
  });

  it("is blind to padding, because the Action trims it away anyway", () => {
    expect(hasChanged({ ...ida, firstName: " Ida " }, ida)).toBe(false);
  });

  it("sees an untouched row as unchanged", () => {
    expect(hasChanged(ida, ida)).toBe(false);
  });

  it("sees a changed gender", () => {
    expect(hasChanged({ ...ida, gender: "other" }, ida)).toBe(true);
  });
});

describe("normalise", () => {
  it("trims the names and leaves the rest alone", () => {
    expect(
      normalise({ ...ida, firstName: " Ida ", lastName: "Hansen " }),
    ).toEqual(ida);
  });
});

describe("displayValue", () => {
  it("writes the birth date in the reader's notation", () => {
    expect(displayValue("birthDate", ida, "da-DK", GENDERS)).toMatch(
      /^02\D04\D1939$/,
    );
    expect(displayValue("birthDate", ida, "en-US", GENDERS)).toMatch(
      /^04\D02\D1939$/,
    );
  });

  it("writes the same calendar day the value names, in every notation", () => {
    for (const locale of ["da-DK", "en-US", "de-DE"] as const) {
      expect(displayValue("birthDate", ida, locale, GENDERS)).toContain("1939");
    }
  });

  it("looks the gender up rather than printing the enum", () => {
    expect(displayValue("gender", ida, "da-DK", GENDERS)).toBe("Frau");
  });

  it("shows a name as it was typed", () => {
    expect(displayValue("firstName", ida, "da-DK", GENDERS)).toBe("Ida");
  });

  it("shows nothing for a field nobody has filled in", () => {
    expect(
      displayValue("birthDate", { ...ida, birthDate: "" }, "da-DK", GENDERS),
    ).toBe("");
  });
});
