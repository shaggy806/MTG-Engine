import { defineCard } from "../define.js";

export default defineCard({
  name: "Coordinated Charge",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Creatures you control get +2/+1 until end of turn.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 2,
    toughness: 1,
    duration: "end-of-turn",
  },
});
