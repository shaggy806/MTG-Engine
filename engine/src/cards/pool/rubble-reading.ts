import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubble Reading",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land. Scry 2.",
  targets: ["land"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "scry", amount: 2 }] },
});
