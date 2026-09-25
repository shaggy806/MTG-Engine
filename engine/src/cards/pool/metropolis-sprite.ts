import { defineCard } from "../define.js";

export default defineCard({
  name: "Metropolis Sprite",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{U}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
