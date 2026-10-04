import { defineCard } from "../define.js";

// EDHREC rank 4968.
// Makes Soldier → uses "Soldier Token".
//
// Rulings:
//   If King Darien leaves the battlefield, the other creatures immediately lose the +1/+1 bonus;
//     a creature already dealt damage may die before the sacrifice ability resolves.

const ANTHEM_TEXT = "Other creatures you control get +1/+1.";
const GROW_TEXT =
  "{3}{G}{W}: Put a +1/+1 counter on King Darien and create a 1/1 white Soldier creature token.";
const SAC_TEXT =
  "Sacrifice King Darien: Creature tokens you control gain hexproof and indestructible until end of turn.";

const TOKENS = { type: "creature", token: true, controlledBy: "you" } as const;

export default defineCard({
  name: "King Darien XLVIII",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: `${ANTHEM_TEXT}\n${GROW_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: "{3}{G}{W}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "create-token", token: "Soldier Token", count: 1 },
        ],
      },
      resolve: null,
      text: GROW_TEXT,
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: TOKENS, keyword: "hexproof", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: TOKENS, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
