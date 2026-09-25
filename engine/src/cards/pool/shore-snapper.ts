import { defineCard } from "../define.js";

export default defineCard({
  name: "Shore Snapper",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  text: "{U}: This creature gains islandwalk until end of turn. (It can't be blocked as long as defending player controls an Island.)",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "islandwalk",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{U}: This creature gains islandwalk until end of turn.",
    },
  ],
});
