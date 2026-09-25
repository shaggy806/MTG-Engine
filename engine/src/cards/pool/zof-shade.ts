import { defineCard } from "../define.js";

export default defineCard({
  name: "Zof Shade",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shade"],
  power: 2,
  toughness: 2,
  text: "{2}{B}: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}: This creature gets +2/+2 until end of turn.",
    },
  ],
});
