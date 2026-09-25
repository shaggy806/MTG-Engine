import { defineCard } from "../define.js";

export default defineCard({
  name: "Refocus",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Untap target creature.\nDraw a card.",
  targets: ["creature"],
  effect: { kind: "sequence", effects: [{ kind: "untap", target: 0 }, { kind: "draw", amount: 1 }] },
});
