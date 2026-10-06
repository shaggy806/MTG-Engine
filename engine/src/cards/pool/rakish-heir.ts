import { defineCard } from "../define.js";

// EDHREC rank 6532.

const TEXT = "Whenever a Vampire you control deals combat damage to a player, put a +1/+1 counter on it.";

export default defineCard({
  name: "Rakish Heir",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtype: "Vampire" } },
      targets: [],
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
