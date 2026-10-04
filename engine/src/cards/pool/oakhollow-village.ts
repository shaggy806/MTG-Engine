import { defineCard } from "../define.js";

// EDHREC rank 2948.
// The last ability reads each permanent's types as it resolves (the ruling):
// a Bear that entered this turn and has since become a Frog gets a counter.

const COUNTER_TEXT =
  "{G}, {T}: Put a +1/+1 counter on each Frog, Rabbit, Raccoon, or Squirrel you control that entered the battlefield this turn.";

export default defineCard({
  name: "Oakhollow Village",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n{T}: Add {G}. Spend this mana only to cast a creature spell.\n${COUNTER_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: 1,
        spendOnly: { spell: { type: "creature" }, text: "Spend this mana only to cast a creature spell." },
      },
      resolve: null,
      text: "{T}: Add {G}. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: {
          subtypes: ["Frog", "Rabbit", "Raccoon", "Squirrel"],
          controlledBy: "you",
          enteredThisTurn: true,
        },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
