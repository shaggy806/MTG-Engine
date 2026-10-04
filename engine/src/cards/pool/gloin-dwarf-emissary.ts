import { defineCard } from "../define.js";

// EDHREC rank 2553.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2023-06-16] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype.
//   [2023-06-16] Some abilities trigger "whenever you cast a historic spell." Such an ability
//     resolves before the spell that caused it to trigger. It resolves even if that spell is
//     countered.
//   [2023-06-16] Lands are never cast, so abilities that trigger "whenever you cast a historic
//     spell" won't trigger if you play a legendary land.

const TREASURE_TEXT =
  "Whenever you cast a historic spell, create a Treasure token. This ability triggers only once each turn.";
const GOAD_TEXT = "{T}, Sacrifice a Treasure: Goad target creature.";

export default defineCard({
  name: "Glóin, Dwarf Emissary",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Advisor"],
  power: 3,
  toughness: 3,
  text: `${TREASURE_TEXT} (Artifacts, legendaries, and Sagas are historic.)\n${GOAD_TEXT} (Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        // Historic (rule 700.6): an artifact, a legendary, or a Saga — Jhoira's filter.
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Treasure" } } },
      targets: ["creature"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
  ],
});
