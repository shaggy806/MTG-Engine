import { defineCard } from "../define.js";

export default defineCard({
  name: "River Merfolk",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 2,
  toughness: 1,
  text: "{U}: This creature gains mountainwalk until end of turn. (It can't be blocked as long as defending player controls a Mountain.)",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "mountainwalk",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{U}: This creature gains mountainwalk until end of turn.",
    },
  ],
});
