import { defineCard } from "../define.js";

export default defineCard({
  name: "Magma Jet",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Magma Jet deals 2 damage to any target. Scry 2.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 2, target: 0 }, { kind: "scry", amount: 2 }],
  },
});
