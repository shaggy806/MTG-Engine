import { defineCard } from "../define.js";

export default defineCard({
  name: "Omen of the Dead",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: "Flash\nWhen this enchantment enters, return target creature card from your graveyard to your hand.\n{2}{B}, Sacrifice this enchantment: Scry 2.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "{2}{B}, Sacrifice this enchantment: Scry 2.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this enchantment enters, return target creature card from your graveyard to your hand.",
    },
  ],
});
