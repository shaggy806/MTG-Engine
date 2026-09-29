import { defineCard } from "../define.js";
import { EVERY_CREATURE_TYPE } from "../../subtypes.js";

const TEXT =
  "{X}: Until end of turn, creatures you control have base power and toughness X/X and gain all creature types.";

// The creatures it reaches are fixed as it resolves; X = 0 makes them 0/0
// (the ruling). Effects that raise or lower P/T without setting it, and
// counters, still apply on top of the new base.
export default defineCard({
  name: "Mirror Entity",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: `Changeling (This card is every creature type.)\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{X}", tap: false },
      targets: [],
      effect: {
        kind: "animate-all",
        filter: { type: "creature", controlledBy: "you" },
        power: "x",
        toughness: "x",
        addSubtypes: [EVERY_CREATURE_TYPE],
        duration: "end-of-turn",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
