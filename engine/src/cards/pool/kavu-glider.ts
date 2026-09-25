import { defineCard } from "../define.js";

export default defineCard({
  name: "Kavu Glider",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Kavu"],
  power: 2,
  toughness: 1,
  text: "{W}: This creature gets +0/+1 until end of turn.\n{U}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{W}: This creature gets +0/+1 until end of turn.",
    },
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains flying until end of turn.",
    },
  ],
});
