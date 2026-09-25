import { defineCard } from "../define.js";

export default defineCard({
  name: "Sheltering Light",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Target creature gains indestructible until end of turn. Scry 1. (Damage and effects that say \"destroy\" don't destroy the creature.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      { kind: "scry", amount: 1 },
    ],
  },
});
