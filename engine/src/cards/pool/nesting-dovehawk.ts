import { defineCard } from "../define.js";

// EDHREC rank 3107.
//
// Rulings:
//   [2024-01-12] The new creature token copies the characteristics of the original token as stated
//     by the effect that created the original token.
//   [2024-01-12] Any enters-the-battlefield abilities of the copied token will trigger when the
//     new token enters the battlefield. Any "as [this creature] enters the battlefield" or "[this
//     creature] enters the battlefield with" abilities of the copied token will also work.
//   [2024-01-12] The new token doesn't copy whether the original token is tapped or untapped,
//     whether it has any counters on it or Auras and Equipment attached to it, or any noncopy
//     effects that have changed its power, toughness, color, and so on.
//   [2024-01-12] If you choose to copy a creature token that's a copy of another creature, the new
//     creature token will copy the characteristics of whatever the original token is copying.
//   [2024-01-12] Populate doesn't target the creature token you're copying. You choose that
//     creature token as you're taking the populate action. You can choose any creature token you
//     control. If a spell or ability causes you to create a creature token and then instructs you
//     to populate, you may choose to copy the token you just created, or you may choose to copy
//     another creature token you control.
//   [2024-01-12] If you control no creature tokens when you populate, nothing will happen.

const POPULATE_TEXT = "At the beginning of combat on your turn, populate. (Create a token that's a copy of a creature token you control.)";
const COUNTER_TEXT = "Whenever a creature token you control enters, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Nesting Dovehawk",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${POPULATE_TEXT}\n${COUNTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "populate" },
      resolve: null,
      text: POPULATE_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: true, type: "creature" },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
