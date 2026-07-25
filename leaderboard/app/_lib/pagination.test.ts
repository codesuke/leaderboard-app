import { describe, expect, it } from "vitest";
import { paginate } from "./pagination";

describe("paginate", () => {
  it("returns the first pageSize items for page 1", () => {
    const items = [1, 2, 3, 4, 5];

    expect(paginate(items, 1, 2)).toEqual([1, 2]);
  });

  it("returns the next slice for page 2", () => {
    const items = [1, 2, 3, 4, 5];

    expect(paginate(items, 2, 2)).toEqual([3, 4]);
  });

  it("returns a partial slice on the last page", () => {
    const items = [1, 2, 3, 4, 5];

    expect(paginate(items, 3, 2)).toEqual([5]);
  });
});
