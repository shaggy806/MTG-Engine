import { defineCard } from "../define.js";

// EDHREC rank 3205.
//
// Rulings:
//   [2024-11-08] To double the number of each kind of counter on a permanent, put another counter
//     on it for each counter it already has. Effects that interact with counters being put onto
//     permanents, such as the effect of Branching Evolution, apply as appropriate.
//
// "Up to two target …" is one "any number" group capped at two (Deepglow
// Skate's shape), each member done in turn; `double-counters` puts the
// counters the way `add-counter` does, so a replacement applies (the ruling).
const COMBAT_TEXT =
  "At the beginning of combat on your turn, put a +1/+1 counter on each of up to two target creatures you control.";
const DOUBLE_TEXT =
  "{G}{U}, {T}: Double the number of each kind of counter on up to two target creatures and/or artifacts you control.";

export default defineCard({
  name: "Zimone, Paradox Sculptor",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  text: `${COMBAT_TEXT}\n${DOUBLE_TEXT}`,
  activated: [
    {
      cost: { mana: "{G}{U}", tap: true },
      targets: [
        {
          kind: "any-number",
          of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["creature", "artifact"] } },
          max: 2,
        },
      ],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "double-counters", target: 0 } },
      resolve: null,
      text: DOUBLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "any-number", of: "creature-you-control", max: 2 }],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
