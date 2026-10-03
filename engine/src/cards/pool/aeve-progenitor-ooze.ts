import { defineCard } from "../define.js";

const STORM_TEXT =
  "Storm (When you cast this spell, copy it for each spell cast before it this turn. Copies become tokens.)";
const TOKEN_TEXT = "Aeve isn't legendary if it's a token.";
const ENTER_TEXT = "Aeve enters with a +1/+1 counter on it for each other Ooze you control.";

// The storm copies resolve one by one, each a token once it does (rule
// 707.10f) — so not legendary — and each counting the Oozes already there as
// it enters, never itself (the rulings: with no Oozes at first, the first copy
// gets none, the next one, and so on).
export default defineCard({
  name: "Aeve, Progenitor Ooze",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 2,
  toughness: 2,
  text: `${STORM_TEXT}\n${TOKEN_TEXT}\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm — when you cast this spell, copy it for each spell cast before it this turn.",
    },
  ],
  static: [
    { affects: { scope: "self" }, notLegendaryIfToken: true, text: TOKEN_TEXT },
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { countOf: { subtype: "Ooze", controlledBy: "you" } } },
      },
      text: ENTER_TEXT,
    },
  ],
});
