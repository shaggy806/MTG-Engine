import { defineCard } from "../define.js";

export default defineCard({
  name: "Surgical Skullbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, Sacrifice this artifact: Draw a card.\n{2}{U}, Sacrifice this artifact: Return target creature to its owner's hand. Draw a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Draw a card.",
    },
    {
      cost: { mana: "{2}{U}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "return-to-hand", target: 0 }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "{2}{U}, Sacrifice this artifact: Return target creature to its owner's hand. Draw a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
