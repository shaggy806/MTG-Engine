import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunderscape Apprentice",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{B}, {T}: Target player loses 1 life.\n{G}, {T}: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{B}, {T}: Target player loses 1 life.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G}, {T}: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
