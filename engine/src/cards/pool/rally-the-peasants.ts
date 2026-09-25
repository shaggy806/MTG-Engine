import { defineCard } from "../define.js";

export default defineCard({
  name: "Rally the Peasants",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  flashback: { cost: "{2}{R}" },
  text: "Creatures you control get +2/+0 until end of turn.\nFlashback {2}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", controlledBy: "you" },
    power: 2,
    toughness: 0,
    duration: "end-of-turn",
  },
});
