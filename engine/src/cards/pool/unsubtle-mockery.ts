import { defineCard } from "../define.js";

export default defineCard({
  name: "Unsubtle Mockery",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Unsubtle Mockery deals 4 damage to target creature. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 4, target: 0 }, { kind: "surveil", amount: 1 }],
  },
});
