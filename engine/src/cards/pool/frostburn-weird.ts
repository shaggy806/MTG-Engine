import { defineCard } from "../define.js";

export default defineCard({
  name: "Frostburn Weird",
  manaCost: "{U/R}{U/R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Weird"],
  power: 1,
  toughness: 4,
  text: "{U/R}: This creature gets +1/-1 until end of turn.",
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
