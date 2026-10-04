import { defineCard } from "../define.js";

// EDHREC rank 3775.
//
// Rulings:
//   [2024-11-08] Raid abilities evaluate the entire turn to see if you attacked with a creature.
//     That creature doesn't have to still be on the battlefield.
//
// The raid intervening-if is Alesha, Who Laughs at Fate's.
const RAID_TEXT =
  "Raid — At the beginning of your end step, if you attacked this turn, create a 1/1 red Goblin creature token.";

export default defineCard({
  name: "Searslicer Goblin",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 1,
  text: RAID_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 1 },
      resolve: null,
      text: RAID_TEXT,
    },
  ],
});
