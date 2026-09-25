import { defineCard } from "../define.js";

export default defineCard({
  name: "Tragic Poet",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice this creature: Return target enchantment card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{T}, Sacrifice this creature: Return target enchantment card from your graveyard to your hand.",
    },
  ],
});
