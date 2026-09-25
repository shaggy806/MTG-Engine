import { defineCard } from "../define.js";

export default defineCard({
  name: "Horizon Seeker",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 2,
  text: "Boast — {1}{G}: Search your library for a basic land card, reveal it, put it into your hand, then shuffle. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "Boast — {1}{G}: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
      boast: true,
    },
  ],
});
