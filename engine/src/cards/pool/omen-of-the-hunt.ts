import { defineCard } from "../define.js";

export default defineCard({
  name: "Omen of the Hunt",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: "Flash\nWhen this enchantment enters, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.\n{2}{G}, Sacrifice this enchantment: Scry 2.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "{2}{G}, Sacrifice this enchantment: Scry 2.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "When this enchantment enters, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
