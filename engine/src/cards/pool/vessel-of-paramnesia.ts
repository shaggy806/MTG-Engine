import { defineCard } from "../define.js";

export default defineCard({
  name: "Vessel of Paramnesia",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "{U}, Sacrifice this enchantment: Target player mills three cards. Draw a card.",
  activated: [
    {
      cost: { mana: "{U}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "mill", target: 0, amount: 3 }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "{U}, Sacrifice this enchantment: Target player mills three cards. Draw a card.",
    },
  ],
});
