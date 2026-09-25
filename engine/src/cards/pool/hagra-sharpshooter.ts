import { defineCard } from "../define.js";

export default defineCard({
  name: "Hagra Sharpshooter",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin", "Ally"],
  power: 2,
  toughness: 2,
  text: "{4}{B}: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{B}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{B}: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
