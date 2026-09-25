import { defineCard } from "../define.js";

export default defineCard({
  name: "Iron Will",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Target creature gets +0/+4 until end of turn.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 0, toughness: 4, duration: "end-of-turn" },
});
