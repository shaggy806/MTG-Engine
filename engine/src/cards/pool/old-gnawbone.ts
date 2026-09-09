import { defineCard } from "../define.js";

export default defineCard({
  name: "Old Gnawbone",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 7,
  toughness: 7,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever a creature you control deals combat damage to a player, create " +
    "that many Treasure tokens.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: { triggerValue: true } },
      resolve: null,
      text:
        "Whenever a creature you control deals combat damage to a player, " +
        "create that many Treasure tokens.",
    },
  ],
});
