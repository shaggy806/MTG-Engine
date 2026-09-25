import { defineCard } from "../define.js";

export default defineCard({
  name: "Dross Ripper",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Dog"],
  power: 3,
  toughness: 3,
  text: "{2}{B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
