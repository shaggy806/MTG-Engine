import { defineCard } from "../define.js";

export default defineCard({
  name: "Bastion Mastodon",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Elephant"],
  power: 4,
  toughness: 5,
  text: "{W}: This creature gains vigilance until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "vigilance",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{W}: This creature gains vigilance until end of turn.",
    },
  ],
});
