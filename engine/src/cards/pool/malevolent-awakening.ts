import { defineCard } from "../define.js";

export default defineCard({
  name: "Malevolent Awakening",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{1}{B}{B}, Sacrifice a creature: Return target creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}{B}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{B}{B}, Sacrifice a creature: Return target creature card from your graveyard to your hand.",
    },
  ],
});
