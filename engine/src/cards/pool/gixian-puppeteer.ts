import { defineCard } from "../define.js";

// EDHREC rank 4207.

const DRAW_TEXT = "Whenever you draw your second card each turn, each opponent loses 2 life and you gain 2 life.";
const DIES_TEXT =
  "When this creature dies, return another target creature card with mana value 3 or less from your graveyard to the battlefield.";

export default defineCard({
  name: "Gixian Puppeteer",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Warlock"],
  power: 4,
  toughness: 3,
  text: DRAW_TEXT + "\n" + DIES_TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "other",
          of: {
            kind: "card-in-graveyard",
            whose: "you",
            filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
          },
          than: "source",
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
