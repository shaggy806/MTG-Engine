import { defineCard } from "../define.js";

// "Attacks an opponent": attacking a planeswalker doesn't trigger it (ruling;
// `defender: "player"`). The creature enters attacking that opponent even if
// Kaalia is attacking something else by then, and if the opponent has left
// the game it just enters tapped, attacking nobody (rulings; rule 508.4a).
// Defender or Propaganda don't stop it: they restrict declaring attackers
// (508.4c).
const ATTACK_TEXT =
  "Whenever Kaalia attacks an opponent, you may put an Angel, Demon, or Dragon creature card from your hand onto the battlefield tapped and attacking that opponent.";

export default defineCard({
  name: "Kaalia of the Vast",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self", defender: "player" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", subtypes: ["Angel", "Demon", "Dragon"] },
        enterTapped: true,
        attacking: { player: "trigger-player" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
