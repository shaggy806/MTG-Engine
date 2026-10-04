import { defineCard } from "../define.js";

// EDHREC rank 5207.
//
// Rulings:
//   [2026-06-29] Belladonna Took's ability has no effect each time beyond the third it resolves in
//     a turn.

export default defineCard({
  name: "Belladonna Took",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Citizen"],
  power: 2,
  toughness: 2,
  text: "Whenever a token you control enters, you gain 1 life if this is the first time this ability has resolved this turn. If it's the second time, draw a card. If it's the third time, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true } },
      targets: [],
      // Omnath, Locus of Creation's shape: a fourth resolution and every one
      // after it does nothing (the ruling).
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 1 },
            then: { kind: "gain-life", amount: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 2 },
            then: { kind: "draw", amount: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 3 },
            then: {
              kind: "add-counter-all",
              filter: { type: "creature", controlledBy: "you" },
              counter: "+1/+1",
              amount: 1,
            },
          },
        ],
      },
      resolve: null,
      text: "Whenever a token you control enters, you gain 1 life if this is the first time this ability has resolved this turn. If it's the second time, draw a card. If it's the third time, put a +1/+1 counter on each creature you control.",
    },
  ],
});
