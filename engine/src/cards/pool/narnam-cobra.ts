import { defineCard } from "../define.js";

export default defineCard({
  name: "Narnam Cobra",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 1,
  text: "{G}: This creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{G}: This creature gains deathtouch until end of turn.",
    },
  ],
});
