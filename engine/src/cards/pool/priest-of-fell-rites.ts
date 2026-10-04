import { defineCard } from "../define.js";
import { unearth } from "../helpers.js";

// EDHREC rank 2591.
//
// Rulings:
//   [2021-06-18] You choose the target of the first ability before paying any of that ability's
//     costs. In other words, you can't choose Priest of Fell Rites itself as the target to bring
//     it back from the graveyard.

const RETURN_TEXT =
  "{T}, Pay 3 life, Sacrifice this creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.";
const UNEARTH_TEXT =
  "Unearth {3}{W}{B} ({3}{W}{B}: Return this card from your graveyard to the battlefield. It gains haste. Exile it at the beginning of the next end step or if it would leave the battlefield. Unearth only as a sorcery.)";

export default defineCard({
  name: "Priest of Fell Rites",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 2,
  text: `${RETURN_TEXT}\n${UNEARTH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 3, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
      sorcerySpeed: true,
    },
    unearth("{3}{W}{B}"),
  ],
});
