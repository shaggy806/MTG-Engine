import { defineCard } from "../define.js";

// EDHREC rank 5660.
//
// Rulings:
//   [2025-06-06] The value of X is calculated only once, as the reflexive triggered ability
//     resolves.
//   [2025-06-06] If the exiled card has {X} in its mana cost, X is 0 for the purpose of
//     determining its mana value.
//   [2025-06-06] You don't choose a target for Cait Sith's ability at the time it triggers.
//     Rather, a second "reflexive" ability triggers when you exile a card this way. You choose a
//     target for that ability as it goes on the stack.
//
// The exile is an impulse draw (Tavern Brawler's), and "when you exile a card
// this way" is a reflexive trigger (rule 603.12) made only if a card was
// exiled — none is from an empty library. X is the exiled card's mana value,
// carried as the reflexive ability's trigger value: a card's mana value
// can't change while it sits in exile, so reading it as the ability triggers
// gives the number it has as it resolves.
const TEXT =
  "Lucky Slots — At the beginning of combat on your turn, scry 1, then exile the top card of your library. You may play that card this turn. When you exile a card this way, target creature you control gets +X/+0 until end of turn, where X is that card's mana value.";

export default defineCard({
  name: "Cait Sith, Fortune Teller",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Cat", "Moogle"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "scry",
        amount: 1,
        then: {
          kind: "sequence",
          effects: [
            { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "reflexive-trigger",
                targets: ["creature-you-control"],
                value: { thisWay: "exiled", sumOf: "mana-value" },
                effect: {
                  kind: "modify-pt",
                  target: 0,
                  power: { triggerValue: true },
                  toughness: 0,
                  duration: "end-of-turn",
                },
                text: "When you exile a card this way, target creature you control gets +X/+0 until end of turn, where X is that card's mana value.",
              },
            },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
