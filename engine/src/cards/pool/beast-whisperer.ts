import { defineCard } from "../define.js";

// A `cast-spell` trigger filtered to creature spells (Chulane's shape).
// `otherOnly` is rule 113.6, not an added "another": the spell a `spell-cast`
// event is about joins the trigger scan with its own abilities, and Beast
// Whisperer is itself a creature spell, so without it the card would draw off
// its own cast from the stack, where its ability doesn't function. A Beast
// Whisperer on the battlefield is never the spell being cast, so excluding
// the source loses nothing the card does.
const CAST_TEXT = "Whenever you cast a creature spell, draw a card.";

export default defineCard({
  name: "Beast Whisperer",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 3,
  text: CAST_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
