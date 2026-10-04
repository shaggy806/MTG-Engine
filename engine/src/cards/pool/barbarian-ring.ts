import { defineCard } from "../define.js";

// EDHREC rank 4836.

// Cephalid Coliseum's cycle: the damage rides on the mana ability, and the
// threshold ability is the land's own, dealt as it last existed once it's
// sacrificed.
const MANA_TEXT = "{T}: Add {R}. This land deals 1 damage to you.";
const SHOCK_TEXT =
  "Threshold — {R}, {T}, Sacrifice this land: It deals 2 damage to any target. Activate only if there are seven or more cards in your graveyard.";

export default defineCard({
  name: "Barbarian Ring",
  colors: [],
  types: ["land"],
  text: `${MANA_TEXT}\n${SHOCK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1, painToController: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{R}", tap: true, sacrifice: "self" },
      condition: { kind: "threshold" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: SHOCK_TEXT,
    },
  ],
});
