import { defineCard } from "../define.js";

export default defineCard({
  name: "Truefire Paladin",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\n{R}{W}: This creature gets +2/+0 until end of turn.\n{R}{W}: This creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{R}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}{W}: This creature gets +2/+0 until end of turn.",
    },
    {
      cost: { mana: "{R}{W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{R}{W}: This creature gains first strike until end of turn.",
    },
  ],
});
