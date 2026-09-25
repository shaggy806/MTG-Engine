import { defineCard } from "../define.js";

export default defineCard({
  name: "Gruul Nodorog",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  text: "{R}: This creature gains menace until end of turn. (It can't be blocked except by two or more creatures.)",
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
