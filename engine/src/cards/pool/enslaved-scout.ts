import { defineCard } from "../define.js";

export default defineCard({
  name: "Enslaved Scout",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Scout"],
  power: 2,
  toughness: 2,
  text: "{2}: This creature gains mountainwalk until end of turn. (It can't be blocked as long as defending player controls a Mountain.)",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "mountainwalk",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gains mountainwalk until end of turn.",
    },
  ],
});
