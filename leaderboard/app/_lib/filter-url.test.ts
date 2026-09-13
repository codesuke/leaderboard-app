import { describe, expect, it } from "vitest";
import {
  decodeFiltersFromSearchParams,
  encodeFiltersToSearchParams,
} from "./filter-url";
import type { StudentFilters } from "./filtering";

function roundTrip(filters: StudentFilters): StudentFilters {
  return decodeFiltersFromSearchParams(encodeFiltersToSearchParams(filters));
}

describe("encodeFiltersToSearchParams / decodeFiltersFromSearchParams", () => {
  it("round-trips an empty filter set", () => {
    expect(roundTrip({})).toEqual({});
  });

  it("round-trips multi-select filters", () => {
    const filters: StudentFilters = {
      batches: ["S1", "T2"],
      oldBatches: ["T3"],
      branches: ["CS", "CSE-AI"],
      attendanceStatuses: ["Poor", "Very Poor"],
      codingGrades: ["Expert"],
    };
    expect(roundTrip(filters)).toEqual(filters);
  });

  it("round-trips range and string filters", () => {
    const filters: StudentFilters = {
      scoreMin: 40,
      scoreMax: 80,
      rollNumberMin: "2401330120100",
      rollNumberMax: "2401330120200",
      ppeAttendanceMin: 50,
      ppeAttendanceMax: 90,
      batchTierMin: "S1",
      batchTierMax: "T3",
      search: "vedant",
    };
    expect(roundTrip(filters)).toEqual(filters);
  });

  it("round-trips boolean and enum filters", () => {
    const filters: StudentFilters = {
      provisionalOnly: true,
      flaggedOnly: true,
      offlineAttempted: false,
      movementDirection: "down",
      codingGradeMovement: "regressed",
      flaggedPreset: true,
    };
    expect(roundTrip(filters)).toEqual(filters);
  });

  it("omits false/undefined values instead of encoding them, keeping empty filters equal", () => {
    const params = encodeFiltersToSearchParams({
      provisionalOnly: false,
      offlineAttempted: undefined,
    });
    expect(params.toString()).toBe("");
  });

  it("decodes a hand-written, partial query string", () => {
    const params = new URLSearchParams("batches=S1,T2&search=vedant");
    expect(decodeFiltersFromSearchParams(params)).toEqual({
      batches: ["S1", "T2"],
      search: "vedant",
    });
  });

  it("ignores a malformed enum value rather than throwing", () => {
    const params = new URLSearchParams("movementDirection=sideways");
    expect(decodeFiltersFromSearchParams(params)).toEqual({});
  });

  it("ignores a malformed numeric value rather than throwing", () => {
    const params = new URLSearchParams("scoreMin=not-a-number");
    expect(decodeFiltersFromSearchParams(params)).toEqual({});
  });

  it("ignores an unrecognized query key", () => {
    const params = new URLSearchParams("unknownKey=whatever&search=vedant");
    expect(decodeFiltersFromSearchParams(params)).toEqual({
      search: "vedant",
    });
  });
});
