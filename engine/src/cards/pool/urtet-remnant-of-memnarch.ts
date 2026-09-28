import { defineCard } from "../define.js";

// #98 in top-commanders.txt. Colourless, but the {W}{U}{B}{R}{G} in its
// activated ability puts all five colours in its identity (rule 903.4), which
// `identity.ts` reads straight off `text`.
//
// "Myr" is matched as a subtype everywhere below, through `hasSubtype`, so a
// changeling (rule 702.73a — Morophon, the Boundless) is a Myr for all three
// clauses.
const CAST_TEXT =
  "Whenever you cast a Myr spell, create a 1/1 colorless Myr artifact creature token.";
const COMBAT_TEXT = "At the beginning of combat on your turn, untap each Myr you control.";
const PUMP_TEXT =
  "{W}{U}{B}{R}{G}, {T}: Put three +1/+1 counters on each Myr you control. " +
  "Activate only during your turn.";

export default defineCard({
  name: "Urtet, Remnant of Memnarch",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 2,
  toughness: 2,
  text: `${CAST_TEXT}\n${COMBAT_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      // Urtet is a Myr spell, but casting it never triggers this (rule
      // 113.6: a spell's only abilities that work on the stack are its "when
      // you cast this" ones, which the trigger scan enforces). Casting a
      // second Urtet still triggers the first (rule 601.2i).
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Myr" } },
      targets: [],
      effect: { kind: "create-token", token: "Myr Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      // Beginning of combat step (rule 507), on its controller's turn only.
      // Urtet is a Myr itself, so this also untaps it after its own {T}
      // ability was used in the precombat main phase.
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "untap-all", filter: { subtype: "Myr", controlledBy: "you" } },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: true },
      // "Activate only during your turn" (rule 602.5) — a timing gate, not
      // sorcery speed: any time you hold priority on your own turn is legal,
      // including the beginning of combat with the untap trigger on the stack.
      condition: { kind: "your-turn" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Myr", controlledBy: "you" },
        counter: "+1/+1",
        amount: 3,
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
