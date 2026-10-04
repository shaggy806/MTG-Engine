import { defineCard } from "../define.js";

// EDHREC rank 5329.
//
// Rulings:
//   [2021-09-24] Vampire Socialite's last two abilities care whether an opponent lost life this
//     turn, not how their life total changed. For example, an opponent who gained 2 life and lost
//     1 life in the same turn still lost life.

const OPPONENT_LOST_LIFE = { kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 1 } as const;
const ETB_TEXT =
  "When this creature enters, if an opponent lost life this turn, put a +1/+1 counter on each other Vampire you control.";
const STATIC_TEXT =
  "As long as an opponent lost life this turn, each other Vampire you control enters with an additional +1/+1 counter on it.";

export default defineCard({
  name: "Vampire Socialite",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace (This creature can't be blocked except by two or more creatures.)\n${ETB_TEXT}\n${STATIC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: OPPONENT_LOST_LIFE,
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Vampire", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: OPPONENT_LOST_LIFE,
      // "Other" is left out of the filter: rule 614.12 keeps the replacement
      // off this creature itself.
      replacement: {
        event: "others-enter-battlefield",
        filter: { subtype: "Vampire", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: 1 },
      },
      text: STATIC_TEXT,
    },
  ],
});
