import { defineCard } from "../define.js";

// #379 in top-commanders.txt.
const END_TEXT = "At the beginning of your end step, put a loyalty counter on another target planeswalker you control.";
const PLUS_TEXT =
  '+1: Create a 1/1 red Wizard creature token with "{T}: Add {R}. Spend this mana only to cast a planeswalker spell."';
const MINUS_TEXT =
  "−3: You draw X cards and Commodore Guff deals X damage to each opponent, where X is the number of " +
  "planeswalkers you control.";
const walkers = { countOf: { type: "planeswalker", controlledBy: "you" } } as const;

export default defineCard({
  name: "Commodore Guff",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Guff"],
  loyalty: 5,
  text: `${END_TEXT}\n${PLUS_TEXT}\n${MINUS_TEXT}\nCommodore Guff can be your commander.`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { type: "planeswalker" } } }],
      effect: { kind: "add-counter", target: 0, counter: "loyalty", amount: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Wizard Token (Guff)", count: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: walkers },
          { kind: "damage", amount: walkers, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
});
