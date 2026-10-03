import { defineCard } from "../define.js";

// Mentor (rule 702.134a) is its triggered ability: the target's power is
// compared with Legion Warboss's as the trigger goes on the stack and again
// as it resolves — as Legion Warboss last existed if it has left (the
// rulings). The token's "attacks this combat if able" binds only this
// combat (rule 500.5a), and nothing makes its controller pay a cost to
// attack with it (rule 508.1d — the ruling).
const MENTOR_TEXT =
  "Mentor (Whenever this creature attacks, put a +1/+1 counter on target attacking creature with lesser power.)";
const TOKEN_TEXT =
  "At the beginning of combat on your turn, create a 1/1 red Goblin creature token. That token gains haste until end of turn and attacks this combat if able.";

export default defineCard({
  name: "Legion Warboss",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${MENTOR_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "permanent",
          filter: { type: "creature", attacking: true, power: { op: "lt", n: { amount: { powerOf: "source" } } } },
        },
      ],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: MENTOR_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Goblin Token",
        count: 1,
        gainUntilEndOfTurn: ["haste"],
        attacksThisCombat: true,
      },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
