import { defineCard } from "../define.js";

const ENTER_TEXT =
  "Whenever this creature or another creature you control with power 4 or greater enters, you gain 3 life and draw a card.";
const DIES_TEXT =
  "When this creature dies, if it's not a token, create a token that's a copy of it, except it's an artifact in addition to its other types.";

const GAIN_AND_DRAW = {
  kind: "sequence",
  effects: [
    { kind: "gain-life", amount: 3 },
    { kind: "draw", amount: 1 },
  ],
} as const;

// The copy is of the creature as it last existed (its copiable values,
// rule 707.2) — whatever it was copying, if anything (its ruling). The token
// entering fires the first ability.
export default defineCard({
  name: "Vaultborn Tyrant",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: GAIN_AND_DRAW,
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        otherOnly: true,
      },
      targets: [],
      effect: GAIN_AND_DRAW,
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      condition: { kind: "source", filter: { token: false } },
      targets: [],
      effect: {
        kind: "create-token-copy",
        of: "source",
        count: 1,
        who: "you",
        exceptions: { addTypes: ["artifact"] },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
