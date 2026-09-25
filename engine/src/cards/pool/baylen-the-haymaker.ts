import { defineCard } from "../define.js";

// Rulings:
//   [2024-07-26] Baylen's first ability is a mana ability. It doesn't use the stack and can't be
//     responded to.
//   [2024-07-26] You may tap any untapped tokens you control to activate Baylen's abilities,
//     including creature tokens that entered this turn, even if they don't have haste.

export default defineCard({
  name: "Baylen, the Haymaker",
  manaCost: "{R}{G}{W}",
  colors: ["W", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rabbit", "Warrior"],
  power: 4,
  toughness: 3,
  text: "Tap two untapped tokens you control: Add one mana of any color.\nTap three untapped tokens you control: Draw a card.\nTap four untapped tokens you control: Put three +1/+1 counters on Baylen. It gains trample until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { token: true, controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Tap two untapped tokens you control: Add one mana of any color.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { token: true, controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Tap three untapped tokens you control: Draw a card.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 4, filter: { token: true, controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
          { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "Tap four untapped tokens you control: Put three +1/+1 counters on Baylen. It gains trample until end of turn.",
    },
  ],
});
