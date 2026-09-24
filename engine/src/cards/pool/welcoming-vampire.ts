import { defineCard } from "../define.js";

// "One or more … triggers only once each turn": a per-creature enters trigger
// marked `oncePerTurn`. The power check is part of what triggers it, read as
// each creature enters.
export default defineCard({
  name: "Welcoming Vampire",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever one or more other creatures you control with power 2 or less enter, draw a card. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", power: { op: "lte", n: 2 } },
        otherOnly: true,
      },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text:
        "Whenever one or more other creatures you control with power 2 or less enter, draw a card. This ability triggers only once each turn.",
    },
  ],
});
