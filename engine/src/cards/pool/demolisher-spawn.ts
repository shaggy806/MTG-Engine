import { defineCard } from "../define.js";

// EDHREC rank 6027.

const TEXT =
  "Delirium — Whenever this creature attacks, if there are four or more card types among cards in your graveyard, other attacking creatures get +4/+4 until end of turn.";

export default defineCard({
  name: "Demolisher Spawn",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Horror"],
  power: 7,
  toughness: 7,
  keywords: ["trample", "haste"],
  text: `Trample, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      // Intervening-if (Fear of Missing Out's delirium attack trigger).
      condition: { kind: "delirium" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", attacking: true },
        power: 4,
        toughness: 4,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
