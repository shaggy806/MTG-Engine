import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast a spell, return up to one target nonland permanent an opponent controls with mana value less than or equal to that spell's mana value to its owner's hand.";

export default defineCard({
  name: "Hammerhead Tyrant",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "permanent",
            whose: "opponent",
            filter: {
              notTypes: ["land"],
              manaValue: { op: "lte", n: { amount: { manaValueOf: "trigger-object" } } },
            },
          },
        },
      ],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
