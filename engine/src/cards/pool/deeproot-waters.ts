import { defineCard } from "../define.js";

// EDHREC rank 4387.
//
// Rulings:
//   [2017-09-29] The ability of Deeproot Waters resolves before the spell that caused it to
//     trigger.

const TEXT = "Whenever you cast a Merfolk spell, create a 1/1 blue Merfolk creature token with hexproof.";

export default defineCard({
  name: "Deeproot Waters",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${TEXT} (A creature with hexproof can't be the target of spells or abilities your opponents control.)`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Merfolk" } },
      targets: [],
      effect: { kind: "create-token", token: "Merfolk Token (Deeproot Waters)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
