import { defineCard } from "../define.js";

export default defineCard({
  name: "Thundermaw Hellkite",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "haste"],
  text:
    "Flying, haste\n" +
    "When this creature enters, it deals 1 damage to each creature with flying " +
    "your opponents control. Tap those creatures.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "damage-all",
            filter: { type: "creature", keyword: "flying", controlledBy: "opponent" },
            amount: 1,
          },
          // "Tap those creatures" — the same set, re-read after the damage.
          // A flier that died to it is already gone, which is what the real
          // card does too.
          {
            kind: "tap-all",
            filter: { type: "creature", keyword: "flying", controlledBy: "opponent" },
          },
        ],
      },
      resolve: null,
      text:
        "When Thundermaw Hellkite enters, it deals 1 damage to each creature with " +
        "flying your opponents control. Tap those creatures.",
    },
  ],
});
