import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-3 — a metalcraft conditional static (`condition:
 * "metalcraft"` — you control three or more artifacts).
 */
export default defineCard({
  name: "Ardent Recruit",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "Metalcraft — Ardent Recruit gets +1/+1 as long as you control three or more artifacts.",
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "metalcraft" },
      grantPt: [1, 1],
      text: "Metalcraft — Ardent Recruit gets +1/+1 as long as you control three or more artifacts.",
    },
  ],
});
