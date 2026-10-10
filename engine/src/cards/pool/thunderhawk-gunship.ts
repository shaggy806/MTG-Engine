import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 3646. "Attacking creatures you control" are counted as the
// trigger resolves, itself among them.
const TOKENS = "When this Vehicle enters, create two 2/2 white Astartes Warrior creature tokens with vigilance.";
const FLY = "Whenever this Vehicle attacks, attacking creatures you control gain flying until end of turn.";

export default defineCard({
  name: "Thunderhawk Gunship",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TOKENS}\n${FLY}\nCrew 2`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Astartes Warrior Token", count: 2 },
      resolve: null,
      text: TOKENS,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you", attacking: true },
        keyword: "flying",
        duration: "end-of-turn",
      },
      resolve: null,
      text: FLY,
    },
  ],
  activated: [crew(2)],
});
