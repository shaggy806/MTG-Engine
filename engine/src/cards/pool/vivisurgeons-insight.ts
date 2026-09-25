import { defineCard } from "../define.js";

export default defineCard({
  name: "Vivisurgeon's Insight",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw three cards. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  effect: { kind: "sequence", effects: [{ kind: "draw", amount: 3 }, { kind: "proliferate" }] },
});
