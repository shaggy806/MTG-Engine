import { defineCard } from "../define.js";

export default defineCard({
  name: "Nightwing Shade",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shade"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}{B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
