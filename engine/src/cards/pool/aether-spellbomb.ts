import { defineCard } from "../define.js";

export default defineCard({
  name: "Aether Spellbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{U}, Sacrifice this artifact: Return target creature to its owner's hand.\n{1}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{U}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{U}, Sacrifice this artifact: Return target creature to its owner's hand.",
    },
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
