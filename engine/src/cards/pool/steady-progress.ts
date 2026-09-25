import { defineCard } from "../define.js";

export default defineCard({
  name: "Steady Progress",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)\nDraw a card.",
  effect: { kind: "sequence", effects: [{ kind: "proliferate" }, { kind: "draw", amount: 1 }] },
});
