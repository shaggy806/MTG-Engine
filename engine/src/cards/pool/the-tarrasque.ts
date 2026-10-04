import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5862.
//
// "As long as it was cast" reads how it entered (`cast: true` — a spell cast
// from any zone, the command zone included, the third ruling); it never
// changes for the permanent.
//
// Rulings:
//   [2021-07-23] The fight happens in the declare attackers step before blockers are declared.
//     Unless the creature it is fighting survives, that creature won't be able to block that
//     combat.
//   [2021-07-23] Fighting is not optional. If there is at least one legal target for The
//     Tarrasque's last ability, it must fight.

const CAST_TEXT = "The Tarrasque has haste and ward {10} as long as it was cast.";
const FIGHT_TEXT = "Whenever The Tarrasque attacks, it fights target creature defending player controls.";

export default defineCard({
  name: "The Tarrasque",
  manaCost: "{6}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 10,
  toughness: 10,
  text: `${CAST_TEXT}\n${FIGHT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { cast: true } },
      grantKeywords: ["haste"],
      grantsTriggered: [ward({ mana: "{10}" })],
      text: CAST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-defending-player-controls"],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: FIGHT_TEXT,
    },
  ],
});
