import { defineCard } from "../define.js";

// EDHREC rank 5860.

export default defineCard({
  name: "Ulvenwald Oddity",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  keywords: ["trample", "haste"],
  text: "Trample, haste\n{5}{G}{G}: Transform this creature.",
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: "{5}{G}{G}: Transform this creature.",
    },
  ],
  faces: ["Ulvenwald Oddity", "Ulvenwald Behemoth"],
  transform: true,
});
