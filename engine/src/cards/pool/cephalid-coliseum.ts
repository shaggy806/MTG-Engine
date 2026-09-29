import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Add {U}. This land deals 1 damage to you.";
const LOOT_TEXT =
  "Threshold — {U}, {T}, Sacrifice this land: Target player draws three cards, then discards three cards. Activate only if there are seven or more cards in your graveyard.";

export default defineCard({
  name: "Cephalid Coliseum",
  colors: [],
  types: ["land"],
  text: `${MANA_TEXT}\n${LOOT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1, painToController: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{U}", tap: true, sacrifice: "self" },
      condition: { kind: "threshold" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 3, target: 0 },
          { kind: "discard", target: 0, amount: 3 },
        ],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
