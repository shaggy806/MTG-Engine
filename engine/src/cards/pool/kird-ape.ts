import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-3 — a conditional static ability (`condition: "controls"`).
 * The +1/+2 applies only while its controller controls a Forest; the layer
 * fold re-checks the condition on every characteristics read, so it's live.
 */
export default defineCard({
  name: "Kird Ape",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ape"],
  power: 1,
  toughness: 1,
  text: "Kird Ape has +1/+2 as long as you control a Forest.",
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "controls", filter: { subtype: "Forest" }, atLeast: 1 },
      grantPt: [1, 2],
      text: "Kird Ape has +1/+2 as long as you control a Forest.",
    },
  ],
});
