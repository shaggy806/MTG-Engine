import { defineCard } from "../define.js";

export default defineCard({
  name: "Steeple Creeper",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog", "Snake"],
  power: 4,
  toughness: 2,
  text: "{3}{U}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{3}{U}: This creature gains flying until end of turn.",
    },
  ],
});
