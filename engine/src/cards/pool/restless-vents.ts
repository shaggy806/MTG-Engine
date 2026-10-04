import { defineCard } from "../define.js";

// EDHREC rank 5212.
//
// Rulings:
//   [2023-11-10] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.
//   [2023-11-10] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.

export default defineCard({
  name: "Restless Vents",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B} or {R}.\n{1}{B}{R}: Until end of turn, this land becomes a 2/3 black and red Insect creature with menace. It's still a land.\nWhenever this land attacks, you may discard a card. If you do, draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
    },
    {
      cost: { mana: "{1}{B}{R}", tap: false },
      targets: [],
      // Restless Reef's shape.
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: ["Insect"],
        setColors: ["B", "R"],
        keywords: ["menace"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{B}{R}: Until end of turn, this land becomes a 2/3 black and red Insect creature with menace. It's still a land.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // Printed on the land, so it triggers however it became a creature (the
      // ruling). Hazoret's Monument's loot: "if you do" is the discard happening.
      effect: {
        kind: "may",
        prompt: "Discard a card to draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: { kind: "draw", amount: 1 },
            },
          ],
        },
      },
      resolve: null,
      text: "Whenever this land attacks, you may discard a card. If you do, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
