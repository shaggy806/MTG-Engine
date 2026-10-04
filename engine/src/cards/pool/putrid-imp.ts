import { defineCard } from "../define.js";

// EDHREC rank 5047.

const FLY_TEXT = "Discard a card: This creature gains flying until end of turn.";
const THRESHOLD_TEXT =
  "Threshold — As long as there are seven or more cards in your graveyard, this creature gets +1/+1 and can't block.";

export default defineCard({
  name: "Putrid Imp",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Imp"],
  power: 1,
  toughness: 1,
  text: `${FLY_TEXT}\n${THRESHOLD_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: FLY_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "threshold" },
      grantPt: [1, 1],
      restrictions: ["cant-block"],
      text: THRESHOLD_TEXT,
    },
  ],
});
