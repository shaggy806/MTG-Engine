import { describe, expect, it } from "vitest";

import { VERSION } from "./index.js";

describe("engine", () => {
  it("exposes a version string", () => {
    expect(VERSION).toBe("1.0.0");
  });
});
