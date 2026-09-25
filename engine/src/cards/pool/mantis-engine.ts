import { defineCard } from "../define.js";

export default defineCard({
  name: "Mantis Engine",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 3,
  text: "{2}: This creature gains flying until end of turn. (It can't be blocked except by creatures with flying or reach.)\n{2}: This creature gains first strike until end of turn. (It deals combat damage before creatures without first strike.)",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{2}: This creature gains flying until end of turn.",
    },
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gains first strike until end of turn.",
    },
  ],
});
