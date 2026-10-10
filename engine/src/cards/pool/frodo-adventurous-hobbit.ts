import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// EDHREC rank 4763. "If you gained 3 or more life this turn" is an
// intervening-if (rule 603.4); the draw's two conditions are asked once the
// Ring has tempted you, as the effect gets there.
const ATTACK =
  "Whenever Frodo attacks, if you gained 3 or more life this turn, the Ring tempts you. Then if Frodo is your Ring-bearer and the Ring has tempted you two or more times this game, draw a card.";

export default defineCard({
  name: "Frodo, Adventurous Hobbit",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Scout"],
  power: 1,
  toughness: 3,
  keywords: ["vigilance"],
  pairing: { kind: "partner-with", name: "Sam, Loyal Attendant" },
  text: `Partner with Sam, Loyal Attendant (When this creature enters, target player may put Sam into their hand from their library, then shuffle.)\nVigilance\n${ATTACK}`,
  triggered: [
    partnerWithTrigger("Sam, Loyal Attendant"),
    {
      trigger: { on: "attacks", who: "self" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "the-ring-tempts-you" },
          {
            kind: "conditional",
            condition: {
              kind: "all",
              of: [
                { kind: "source", filter: { ringBearer: true } },
                { kind: "ring-tempted", atLeast: 2 },
              ],
            },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: ATTACK,
    },
  ],
});
