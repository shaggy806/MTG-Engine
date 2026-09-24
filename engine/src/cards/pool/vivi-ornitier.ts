import { defineCard } from "../define.js";

// Top-commanders rank 8.
//
// - The mana ability costs {0} and doesn't tap, so it works while Vivi is
//   summoning sick or tapped from attacking. "Activate only during your turn
//   and only once each turn" is `condition: your-turn` plus `oncePerTurn`;
//   the auto-payer reads both (`manaSources`), and records the activation
//   when a payment uses it, so a second spell that turn can't draw on it
//   again.
// - X is read as the ability resolves, which for a mana ability is the moment
//   it's activated (rule 605.3a). Power 0 or less makes no mana.
// - "Any combination of {U} and/or {R}" with a live X is planned as one
//   compressed option (X units, each U or R), not X+1 enumerated splits —
//   see `ManaOption.anyColorOf`. X mana is always made in full: what a
//   payment doesn't use floats, as either colour.
// - The cast trigger's damage comes from Vivi, so it still happens if Vivi
//   has left the battlefield by the time it resolves (last-known
//   information); the counter then has nothing to go on.
const MANA_TEXT =
  "{0}: Add X mana in any combination of {U} and/or {R}, where X is Vivi Ornitier's power. " +
  "Activate only during your turn and only once each turn.";
const CAST_TEXT =
  "Whenever you cast a noncreature spell, put a +1/+1 counter on Vivi Ornitier " +
  "and it deals 1 damage to each opponent.";

export default defineCard({
  name: "Vivi Ornitier",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 3,
  text: `${MANA_TEXT}\n${CAST_TEXT}`,
  activated: [
    {
      cost: { mana: "{0}", tap: false },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["U", "R"] },
        amount: { powerOf: "source" },
      },
      resolve: null,
      condition: { kind: "your-turn" },
      oncePerTurn: true,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "damage", amount: 1, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
