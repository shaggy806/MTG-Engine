import { defineCard } from "../define.js";

export default defineCard({
  name: "Brine Shaman",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice a creature: Target creature gets +2/+2 until end of turn.\n{1}{U}{U}, Sacrifice a creature: Counter target creature spell.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice a creature: Target creature gets +2/+2 until end of turn.",
    },
    {
      cost: { mana: "{1}{U}{U}", tap: false, sacrifice: "creature-you-control" },
      targets: ["creature-spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{1}{U}{U}, Sacrifice a creature: Counter target creature spell.",
    },
  ],
});
