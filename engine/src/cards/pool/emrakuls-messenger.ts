import { defineCard } from "../define.js";

// EDHREC rank 2529.
//
// Devoid: colorless for all its blue mana cost (`colors: []`), its colour
// identity still blue.

const SPAWN_TEXT =
  'Whenever you draw your second card each turn, create a 0/1 colorless Eldrazi Spawn creature token with "Sacrifice this token: Add {C}."';

export default defineCard({
  name: "Emrakul's Messenger",
  manaCost: "{1}{U}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Faerie", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Devoid (This card has no color.)\nFlying\n${SPAWN_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
      resolve: null,
      text: SPAWN_TEXT,
    },
  ],
});
