import { defineCard } from "../define.js";

export default defineCard({
  name: "Inkrise Infiltrator",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{3}{B}: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{B}: This creature gets +2/+2 until end of turn.",
    },
  ],
});
