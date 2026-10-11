import { defineCard } from "../define.js";

// EDHREC rank 6693.
//
// Barbarian Ring's cycle (Cephalid Coliseum's): the damage rides on the mana
// ability, and the threshold ability's condition is checked as it's
// activated (rule 602.5b), before the land is sacrificed for its cost.
const MANA_TEXT = "{T}: Add {B}. This land deals 1 damage to you.";
const SHRINK_TEXT =
  "Threshold — {B}, {T}, Sacrifice this land: Target creature gets -2/-2 until end of turn. Activate only if there are seven or more cards in your graveyard.";

export default defineCard({
  name: "Cabal Pit",
  colors: [],
  types: ["land"],
  text: `${MANA_TEXT}\n${SHRINK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1, painToController: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{B}", tap: true, sacrifice: "self" },
      condition: { kind: "threshold" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: SHRINK_TEXT,
    },
  ],
});
