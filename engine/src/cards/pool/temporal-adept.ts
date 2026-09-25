import { defineCard } from "../define.js";

export default defineCard({
  name: "Temporal Adept",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{U}{U}{U}, {T}: Return target permanent to its owner's hand.",
  activated: [
    {
      cost: { mana: "{U}{U}{U}", tap: true },
      targets: ["permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{U}{U}{U}, {T}: Return target permanent to its owner's hand.",
    },
  ],
});
