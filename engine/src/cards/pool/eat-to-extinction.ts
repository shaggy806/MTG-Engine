import { defineCard } from "../define.js";

export default defineCard({
  name: "Eat to Extinction",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile target creature or planeswalker. Surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "sequence", effects: [{ kind: "exile", target: 0 }, { kind: "surveil", amount: 1 }] },
});
