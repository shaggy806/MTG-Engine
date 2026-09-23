import { defineCard } from "../define.js";

export default defineCard({
  name: "Dispatch",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Tap target creature.\n" +
    "Metalcraft — If you control three or more artifacts, exile that creature.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "tap", target: 0 },
      // Checked as it resolves (the 2011-06-01 ruling): tap it, then exile it.
      {
        kind: "conditional",
        condition: { kind: "metalcraft" },
        then: { kind: "exile", target: 0 },
      },
    ],
  },
});
