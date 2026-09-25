import { defineCard } from "../define.js";

export default defineCard({
  name: "Dimir Guildmage",
  manaCost: "{U/B}{U/B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "({U/B} can be paid with either {U} or {B}.)\n{3}{U}: Target player draws a card. Activate only as a sorcery.\n{3}{B}: Target player discards a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "{3}{U}: Target player draws a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{3}{B}: Target player discards a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
