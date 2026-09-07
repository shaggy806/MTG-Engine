import { defineCard } from "../define.js";

export default defineCard({
  name: "Hypnotic Specter",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Specter"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying. Whenever Hypnotic Specter deals combat damage to a player, that player discards a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "Whenever Hypnotic Specter deals combat damage to a player, that player discards a card.",
    },
  ],
});
