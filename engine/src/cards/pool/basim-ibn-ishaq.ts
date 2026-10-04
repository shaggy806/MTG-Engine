import { defineCard } from "../define.js";

// EDHREC rank 3152.
//
// Rulings:
//   [2024-07-05] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype. (Jhoira, Weatherlight Captain's filter.)
//   [2024-07-05] Such an ability resolves before the spell that caused it to trigger. It resolves
//     even if that spell is countered.
//   [2024-07-05] Lands are never cast, so playing a legendary land doesn't trigger it.
//
// `otherOnly`: Basim's own spell is in the cast-trigger scan, and his ability only works from
// the battlefield.

const CAST_TEXT =
  "Whenever you cast a historic spell, draw a card. Basim Ibn Ishaq can't be blocked this turn. This ability triggers only once each turn. (Artifacts, legendaries, and Sagas are historic.)";
const DAMAGE_TEXT = "Whenever Basim Ibn Ishaq deals combat damage to a player, put a +1/+1 counter on it.";

export default defineCard({
  name: "Basim Ibn Ishaq",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 2,
  toughness: 2,
  text: `${CAST_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        otherOnly: true,
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      oncePerTurn: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "grant-keyword", target: "source", keyword: "unblockable", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
