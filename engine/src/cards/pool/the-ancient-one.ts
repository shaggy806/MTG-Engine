import { defineCard } from "../define.js";

// EDHREC rank 5783.
//
// Rulings:
//   [2023-11-10] Once The Ancient One has legally attacked or blocked, removing permanent cards
//     from your graveyard so the descend 8 ability no longer applies won't remove The Ancient One
//     from combat.
//   [2023-11-10] Some descend triggered abilities include intervening "if" clauses (i.e. "if you
//     have [four or eight] permanent cards in your graveyard" in the middle of the ability). Each
//     of these abilities checks your graveyard at the moment it would trigger to see if it does.
//     If you don't have the required number of permanent cards in your graveyard at that time, the
//     ability doesn't trigger at all. If it does trigger, it will check again as it tries to
//     resolve. If you don't have the required number of permanent cards in your graveyard at that
//     time, the ability won't resolve and none of its effects will happen.
//   [2023-11-10] Cards with the ability word "descend N" have abilities that care if you have at
//     least N permanent cards in your graveyard.
//   [2023-11-10] You don't choose a target for The Ancient One's activated ability at the time you
//     activate it. Rather, a second "reflexive" ability triggers when you discard a card this way.
//     You choose a target for that ability as it goes on the stack. Each player may respond to
//     this triggered ability as normal.

export default defineCard({
  name: "The Ancient One",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "God"],
  power: 8,
  toughness: 8,
  text: "Descend 8 — The Ancient One can't attack or block unless there are eight or more permanent cards in your graveyard.\n{2}{U}{B}: Draw a card, then discard a card. When you discard a card this way, target player mills cards equal to its mana value.",
  activated: [
    {
      cost: { mana: "{2}{U}{B}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
          {
            // A reflexive trigger (the ruling): its target is chosen as it
            // goes on the stack, and X is the discarded card's mana value.
            kind: "conditional",
            condition: { kind: "this-way", what: "discarded" },
            then: {
              kind: "reflexive-trigger",
              targets: ["player"],
              value: { thisWay: "discarded", sumOf: "mana-value" },
              effect: { kind: "mill", target: 0, amount: { triggerValue: true } },
              text: "When you discard a card this way, target player mills cards equal to its mana value.",
            },
          },
        ],
      },
      resolve: null,
      text: "{2}{U}{B}: Draw a card, then discard a card. When you discard a card this way, target player mills cards equal to its mana value.",
    },
  ],
  static: [
    {
      // Descend 8: permanent cards are those that aren't instants or sorceries.
      affects: { scope: "self" },
      condition: {
        kind: "not",
        of: { kind: "cards-in-graveyard", atLeast: 8, filter: { notTypes: ["instant", "sorcery"] } },
      },
      restrictions: ["cant-attack", "cant-block"],
      text: "Descend 8 — The Ancient One can't attack or block unless there are eight or more permanent cards in your graveyard.",
    },
  ],
});
