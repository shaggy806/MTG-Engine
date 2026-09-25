import { defineCard } from "../define.js";

export default defineCard({
  name: "Locke Cole",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch", "lifelink"],
  text: "Deathtouch, lifelink\nWhenever Locke Cole deals combat damage to a player, draw a card, then discard a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "Whenever Locke Cole deals combat damage to a player, draw a card, then discard a card.",
    },
  ],
});
