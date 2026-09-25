import { defineCard } from "../define.js";

export default defineCard({
  name: "Stream Hopper",
  manaCost: "{U/R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: "{U/R}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{U/R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U/R}: This creature gains flying until end of turn.",
    },
  ],
});
