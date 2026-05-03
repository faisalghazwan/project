import { describe, expect, it } from "vitest";
import { e1rm } from "../e1rm";

describe("e1rm", () => {
  it("returns weight for a single rep", () => {
    expect(e1rm(100, 1)).toBe(100);
  });

  it("matches Epley for multi-rep sets", () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2);
    expect(e1rm(60, 10)).toBeCloseTo(80, 5);
  });

  it("returns 0 for non-positive reps", () => {
    expect(e1rm(100, 0)).toBe(0);
    expect(e1rm(100, -3)).toBe(0);
  });
});
