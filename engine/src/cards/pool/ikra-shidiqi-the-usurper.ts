import { defineCard } from "../define.js";

// #324 in top-commanders.txt.
//
// "That creature's toughness" is read as it resolves, or as it last existed
// on the battlefield if the same combat damage killed it.
const TEXT =
  "Whenever a creature you control deals combat damage to a player, you gain life equal to that creature's toughness.";

export default defineCard({
  name: "Ikra Shidiqi, the Usurper",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Wizard"],
  power: 3,
  toughness: 7,
  keywords: ["menace"],
  pairing: { kind: "partner" },
  text: `Menace\n${TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control" },
      targets: [],
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
