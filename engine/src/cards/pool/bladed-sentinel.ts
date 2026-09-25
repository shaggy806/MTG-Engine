import { defineCard } from "../define.js";

export default defineCard({
  name: "Bladed Sentinel",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 4,
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
