import { defineCard } from "../define.js";

export default defineCard({
  name: "Smash",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Destroy target artifact.\nDraw a card.",
  targets: ["artifact"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "draw", amount: 1 }] },
});
