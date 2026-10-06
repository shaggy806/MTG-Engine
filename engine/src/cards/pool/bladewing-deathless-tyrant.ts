import { defineCard } from "../define.js";

// EDHREC rank 6608.
//
// Rulings:
//   [2022-09-09] The number of creature cards in your graveyard is determined at the time the
//     triggered ability resolves. If any creature cards are in your graveyard as a result of dying
//     in the same combat damage step that the ability triggered in, they will be counted.
//
// An attacker deals its combat damage to the one player or planeswalker it attacks, so the two
// halves never fire for the same damage (Psychic Frog's shape). Cards only, so tokens never count.
const TEXT =
  "Whenever Bladewing deals combat damage to a player or planeswalker, for each creature card in your graveyard, create a 2/2 black Zombie Knight creature token with menace.";
const MAKE = {
  kind: "create-token",
  token: "Zombie Knight Token",
  count: { countInGraveyard: { type: "creature", ownedBy: "you" } },
} as const;

export default defineCard({
  name: "Bladewing, Deathless Tyrant",
  manaCost: "{5}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Skeleton"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "player", combat: true },
      targets: [],
      effect: MAKE,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "deals-damage", who: "self", to: "planeswalker", combat: true },
      targets: [],
      effect: MAKE,
      resolve: null,
      text: TEXT,
    },
  ],
});
