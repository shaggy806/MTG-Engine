import { defineCard } from "../define.js";

export default defineCard({
  name: "Blistering Dieflyn",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 0,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{B/R}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{B/R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B/R}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
