import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Tanglecord",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender\n{G}: This creature gains reach until end of turn. (It can block creatures with flying.)",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "reach", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gains reach until end of turn.",
    },
  ],
});
