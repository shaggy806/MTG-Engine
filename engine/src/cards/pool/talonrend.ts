import { defineCard } from "../define.js";

export default defineCard({
  name: "Talonrend",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\n{U/R}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U/R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{U/R}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
