import { defineCard } from "../define.js";

export default defineCard({
  name: "Pressure Point",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Tap target creature.\nDraw a card.",
  targets: ["creature"],
  effect: { kind: "sequence", effects: [{ kind: "tap", target: 0 }, { kind: "draw", amount: 1 }] },
});
