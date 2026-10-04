import { defineCard } from "../define.js";

// EDHREC rank 3306.
//
// Rulings:
//   [2023-09-01] Blossoming Tortoise's second ability affects only abilities of lands you control
//     on the battlefield. The costs of activated abilities of land cards that work in other zones
//     (such as cycling) won't be reduced.
//   [2023-09-01] Activated abilities contain a colon. They're generally written "[Cost]:
//     [Effect]." Some keyword abilities are activated abilities and will have colons in their
//     reminder text. Triggered abilities (starting with "when," "whenever," or "at") are
//     unaffected by the cost reduction ability of Blossoming Tortoise.

// The returned land needn't be one of the three just milled: the return
// looks at the whole graveyard (Dogmeat, Ever Loyal's shape).
const TRIGGER_TEXT =
  "Whenever this creature enters or attacks, mill three cards, then return a land card from your graveyard to the battlefield tapped.";
const COST_TEXT = "Activated abilities of lands you control cost {1} less to activate.";
const PT_TEXT = "Land creatures you control get +1/+1.";

export default defineCard({
  name: "Blossoming Tortoise",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Turtle"],
  power: 3,
  toughness: 3,
  text: `${TRIGGER_TEXT}\n${COST_TEXT}\n${PT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "return-from-graveyard",
            filter: { type: "land" },
            destination: "battlefield",
            count: 1,
            enterTapped: true,
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "return-from-graveyard",
            filter: { type: "land" },
            destination: "battlefield",
            count: 1,
            enterTapped: true,
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  static: [
    {
      // Only abilities of lands on the battlefield: `applies` matches a
      // permanent source (the ruling: a land card's cycling isn't reduced).
      // Mana abilities are reduced too; the card makes no exception for them.
      affects: { scope: "self" },
      abilityCostModification: { applies: { type: "land", controlledBy: "you" }, reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "filter", filter: { types: ["land", "creature"], controlledBy: "you" } },
      grantPt: [1, 1],
      text: PT_TEXT,
    },
  ],
});
