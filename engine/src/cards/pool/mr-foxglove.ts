import { defineCard } from "../define.js";

// #473 in top-commanders.txt.
//
// The draw is "defending player's hand minus yours", never below 0; the
// creature half asks whether that draw drew anything (`this-way`).
const TEXT =
  "Whenever Mr. Foxglove attacks, draw cards equal to the number of cards in defending player's hand " +
  "minus the number of cards in your hand. If you didn't draw cards this way, you may put a creature " +
  "card from your hand onto the battlefield.";

export default defineCard({
  name: "Mr. Foxglove",
  manaCost: "{2}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Fox", "Rogue"],
  power: 3,
  toughness: 5,
  keywords: ["lifelink"],
  text: `Lifelink\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { difference: [{ cardsInHand: "trigger-player" }, { cardsInHand: "you" }] } },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "drawn", who: "you", atMost: 0 },
            then: {
              kind: "look-and-choose",
              zone: "hand",
              min: 0,
              max: 1,
              destination: "battlefield",
              leftover: "stay",
              filter: { type: "creature" },
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
