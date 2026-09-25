import { defineCard } from "../define.js";

export default defineCard({
  name: "Perilous Shadow",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect", "Shade"],
  power: 0,
  toughness: 4,
  text: "{1}{B}: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}: This creature gets +2/+2 until end of turn.",
    },
  ],
});
