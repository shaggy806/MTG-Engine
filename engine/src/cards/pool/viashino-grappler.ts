import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Grappler",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 3,
  toughness: 1,
  text: "{G}: This creature gains trample until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gains trample until end of turn.",
    },
  ],
});
