import { defineCard } from "../define.js";

export default defineCard({
  name: "Marsh Lurker",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 2,
  text: "Sacrifice a Swamp: This creature gains fear until end of turn. (It can't be blocked except by artifact creatures and/or black creatures.)",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Swamp" } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "fear", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a Swamp: This creature gains fear until end of turn.",
    },
  ],
});
