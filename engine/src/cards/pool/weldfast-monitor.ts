import { defineCard } from "../define.js";

export default defineCard({
  name: "Weldfast Monitor",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Lizard"],
  power: 3,
  toughness: 2,
  text: "{R}: This creature gains menace until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "menace", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gains menace until end of turn.",
    },
  ],
});
