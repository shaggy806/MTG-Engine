import { defineCard } from "../define.js";

export default defineCard({
  name: "Implode",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land.\nDraw a card.",
  targets: ["land"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "draw", amount: 1 }] },
});
