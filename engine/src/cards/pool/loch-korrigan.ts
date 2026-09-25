import { defineCard } from "../define.js";

export default defineCard({
  name: "Loch Korrigan",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{U/B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U/B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{U/B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
