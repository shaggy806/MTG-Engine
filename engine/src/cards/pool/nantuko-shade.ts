import { defineCard } from "../define.js";

export default defineCard({
  name: "Nantuko Shade",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect", "Shade"],
  power: 2,
  toughness: 1,
  text: "{B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
