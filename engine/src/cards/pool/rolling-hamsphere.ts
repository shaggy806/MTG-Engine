import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 4230. X counts the Hamsters as the damage is dealt — the
// three just made among them.
const PUMP = "This Vehicle gets +1/+1 for each Hamster you control.";
const ATTACK =
  "Whenever this Vehicle attacks, create three 1/1 red Hamster creature tokens, then it deals X damage to any target, where X is the number of Hamsters you control.";

export default defineCard({
  name: "Rolling Hamsphere",
  manaCost: "{7}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 4,
  text: `${PUMP}\n${ATTACK}\nCrew 3`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { subtype: "Hamster", controlledBy: "you" }, pt: [1, 1] },
      text: PUMP,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["any-target"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Hamster Token", count: 3 },
          { kind: "damage", target: 0, amount: { countOf: { subtype: "Hamster", controlledBy: "you" } } },
        ],
      },
      resolve: null,
      text: ATTACK,
    },
  ],
  activated: [crew(3)],
});
