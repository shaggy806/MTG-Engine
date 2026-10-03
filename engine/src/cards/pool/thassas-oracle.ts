import { defineCard } from "../define.js";

const ETB =
  "When this creature enters, look at the top X cards of your library, where X is your devotion to blue. " +
  "Put up to one of them on top of your library and the rest on the bottom of your library in a random " +
  "order. If X is greater than or equal to the number of cards in your library, you win the game.";

// Devotion is counted as the ability resolves (the ruling): Thassa's Oracle
// itself counts if it's still on the battlefield. The look is a
// `look-and-choose` back onto the top, the rest to the bottom at random; the
// win is checked once the cards are back, against the same X — "X is greater
// than or equal to the number of cards in your library" is the library's
// size at most X. With X 0 nothing is looked at, and an empty library wins.
export default defineCard({
  name: "Thassa's Oracle",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 3,
  text: `${ETB} (Each {U} in the mana costs of permanents you control counts toward your devotion to blue.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "look-and-choose",
            zone: "library",
            count: { devotionTo: "U" },
            min: 0,
            max: 1,
            destination: "library-top",
            leftover: "bottom-random",
          },
          {
            kind: "conditional",
            condition: {
              kind: "library-size",
              who: "you",
              compare: { op: "lte", n: { amount: { devotionTo: "U" } } },
            },
            then: { kind: "win-game" },
          },
        ],
      },
      resolve: null,
      text: ETB,
    },
  ],
});
