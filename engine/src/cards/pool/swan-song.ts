import { defineCard } from "../define.js";

export default defineCard({
  name: "Swan Song",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Counter target enchantment, instant, or sorcery spell. " +
    "Its controller creates a 2/2 blue Bird creature token with flying.",
  targets: ["enchantment-instant-or-sorcery-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      // Rule 111.11 — the countered spell's *last-known* controller, which is
      // what `who: "target-controller"` reads off target slot 0.
      { kind: "create-token", token: "2/2 Blue Bird Token", count: 1, who: "target-controller" },
    ],
  },
});
