import { defineCard } from "../define.js";

export default defineCard({
  name: "Granite Gargoyle",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Gargoyle"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
