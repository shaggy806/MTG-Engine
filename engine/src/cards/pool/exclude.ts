import { defineCard } from "../define.js";

export default defineCard({
  name: "Exclude",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target creature spell.\nDraw a card.",
  targets: ["creature-spell"],
  effect: { kind: "sequence", effects: [{ kind: "counter", target: 0 }, { kind: "draw", amount: 1 }] },
});
