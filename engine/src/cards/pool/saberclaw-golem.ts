import { defineCard } from "../define.js";

export default defineCard({
  name: "Saberclaw Golem",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 4,
  toughness: 2,
  text: "{R}: This creature gains first strike until end of turn.",
  activated: [
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
  ],
});
