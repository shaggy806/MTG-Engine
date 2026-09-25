import { defineCard } from "../define.js";

export default defineCard({
  name: "Carrion Ants",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 1,
  text: "{1}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
