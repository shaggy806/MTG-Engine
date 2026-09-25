import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyship Stalker",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cat", "Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +1/+0 until end of turn.\n{R}: This creature gains first strike until end of turn.\n{R}: This creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn.",
    },
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{R}: This creature gains first strike until end of turn.",
    },
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gains haste until end of turn.",
    },
  ],
});
