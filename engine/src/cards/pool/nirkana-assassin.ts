import { defineCard } from "../define.js";

export default defineCard({
  name: "Nirkana Assassin",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Assassin", "Ally"],
  power: 2,
  toughness: 3,
  text: "Whenever you gain life, this creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you gain life, this creature gains deathtouch until end of turn.",
    },
  ],
});
