import { defineCard } from "../define.js";

export default defineCard({
  name: "Mnemonic Sphere",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "{1}{U}, Sacrifice this artifact: Draw two cards.\nChannel — {U}, Discard this card: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{1}{U}, Sacrifice this artifact: Draw two cards.",
    },
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Channel — {U}, Discard this card: Draw a card.",
      zone: "hand",
    },
  ],
});
