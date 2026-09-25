import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Reclamation",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{1}{B}, Pay 2 life: Return target creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, payLife: 2 },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{B}, Pay 2 life: Return target creature card from your graveyard to your hand.",
    },
  ],
});
