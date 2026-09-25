import { defineCard } from "../define.js";

export default defineCard({
  name: "Deeptread Merrow",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 2,
  toughness: 1,
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
