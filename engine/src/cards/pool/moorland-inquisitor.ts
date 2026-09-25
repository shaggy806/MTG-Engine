import { defineCard } from "../define.js";

export default defineCard({
  name: "Moorland Inquisitor",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "{2}{W}: This creature gains first strike until end of turn. (It deals combat damage before creatures without first strike.)",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{W}: This creature gains first strike until end of turn.",
    },
  ],
});
