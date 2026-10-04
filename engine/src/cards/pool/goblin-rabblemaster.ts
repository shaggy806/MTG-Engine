import { defineCard } from "../define.js";

// EDHREC rank 4542.
// Makes a 1/1 red Goblin with haste → new token "Goblin Token (Haste)"
// (goblin-token-haste.ts; the existing "Goblin Token" has no haste).
//
// Rulings:
//   [2014-07-18] If, during your declare attackers step, a creature that must attack if able is
//     tapped, is affected by a spell or ability that says it can't attack, or hasn't been under
//     your control continuously since the turn began (and doesn't have haste), then it doesn't
//     attack. If there's a cost associated with having a creature attack, you're not forced to pay
//     that cost, so it doesn't have to attack in that case either.
//   [2014-07-18] The number of attacking Goblins is counted as the last ability resolves, and the
//     bonus is locked in at that time.
//   [2014-07-18] Although Goblin Rabblemaster doesn't force itself to attack, if you control two
//     of them, they'll force each other to attack if able.

const ATTACK_TEXT = "Other Goblin creatures you control attack each combat if able.";
const PUMP_TEXT = "Whenever this creature attacks, it gets +1/+0 until end of turn for each other attacking Goblin.";

export default defineCard({
  name: "Goblin Rabblemaster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${ATTACK_TEXT}\nAt the beginning of combat on your turn, create a 1/1 red Goblin creature token with haste.\n${PUMP_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Goblin", controlledBy: "you" },
        excludeSelf: true,
      },
      restrictions: ["must-attack"],
      text: ATTACK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token (Haste)", count: 1 },
      resolve: null,
      text: "At the beginning of combat on your turn, create a 1/1 red Goblin creature token with haste.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // Counted as it resolves and locked in (the ruling).
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { countOf: { type: "creature", subtype: "Goblin", attacking: true }, excludeSelf: true },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
