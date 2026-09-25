import { defineCard } from "../define.js";

export default defineCard({
  name: "Skull of Orm",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{5}, {T}: Return target enchantment card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{5}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{5}, {T}: Return target enchantment card from your graveyard to your hand.",
    },
  ],
});
