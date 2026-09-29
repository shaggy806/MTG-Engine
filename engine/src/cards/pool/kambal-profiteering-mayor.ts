import { defineCard } from "../define.js";

// #444 in top-commanders.txt. Each copy is of a token as it entered (its
// creating effect's values — the rulings), and a token that has left by
// the time this resolves is copied as it last existed (rule 608.2h).
const COPY_TEXT =
  "Whenever one or more tokens your opponents control enter, for each of them, create a tapped token that's " +
  "a copy of it. This ability triggers only once each turn.";
const DRAIN_TEXT =
  "Whenever one or more tokens you control enter, each opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Kambal, Profiteering Mayor",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 4,
  text: `${COPY_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "opponent", filter: { token: true }, batched: true },
      targets: [],
      effect: { kind: "create-token-copy", of: "entered-together", count: 1, tapped: true, who: "you" },
      resolve: null,
      oncePerTurn: true,
      text: COPY_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true }, batched: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
