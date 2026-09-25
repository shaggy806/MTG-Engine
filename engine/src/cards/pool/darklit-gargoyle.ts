import { defineCard } from "../define.js";

export default defineCard({
  name: "Darklit Gargoyle",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Gargoyle"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{B}: This creature gets +2/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +2/-1 until end of turn.",
    },
  ],
});
