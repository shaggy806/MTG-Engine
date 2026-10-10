import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 2885. The reduction reaches ninjutsu abilities of cards in
// your hand or command zone (`abilityCostModification.ninjutsu`), generic
// mana only.
const REDUCE = "Ninjutsu abilities you activate cost {1} less to activate.";
const LORD = "Other Ninja and Rogue creatures you control get +1/+1.";

export default defineCard({
  name: "Silver-Fur Master",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Rat", "Ninja"],
  power: 2,
  toughness: 2,
  text: `${ninjutsuText("{U}{B}")}\n${REDUCE}\n${LORD}`,
  activated: [ninjutsu("{U}{B}")],
  static: [
    {
      affects: { scope: "self" },
      abilityCostModification: { applies: {}, reduceGeneric: 1, ninjutsu: true },
      text: REDUCE,
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", subtypes: ["Ninja", "Rogue"] },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      text: LORD,
    },
  ],
});
