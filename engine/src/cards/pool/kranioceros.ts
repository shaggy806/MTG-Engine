import { defineCard } from "../define.js";

export default defineCard({
  name: "Kranioceros",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 2,
  text: "{1}{W}: This creature gets +0/+3 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: This creature gets +0/+3 until end of turn.",
    },
  ],
});
