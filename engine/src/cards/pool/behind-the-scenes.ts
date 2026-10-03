import { defineCard } from "../define.js";

const SKULK_TEXT = "Creatures you control have skulk. (They can't be blocked by creatures with greater power.)";
const PUMP_TEXT = "{4}{W}: Creatures you control get +1/+1 until end of turn.";

export default defineCard({
  name: "Behind the Scenes",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${SKULK_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["skulk"],
      text: SKULK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
