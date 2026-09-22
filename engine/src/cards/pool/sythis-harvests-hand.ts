import { defineCard } from "../define.js";

// Rank 155 on the commander list. One cast trigger, all existing vocabulary: a
// `cast-spell` trigger with a type filter on the spell (Guttersnipe's shape),
// paying out a gain-life-then-draw `sequence` (Cloudblazer's).
//
// - "an enchantment spell": the filter reads the spell's types off the stack,
//   so an Aura, a plain enchantment and an enchantment creature all count, and
//   a creature or sorcery that isn't also an enchantment doesn't.
// - "you cast": `who: "you"` — an opponent's enchantment spell does nothing.
//
// The one ruling (2021-06-18): "Sythis's ability doesn't trigger when it is
// cast." That is rule 113.6 — the ability works only while Sythis is on the
// battlefield — and `otherOnly` is what restores it here rather than an added
// "another": the spell a `spell-cast` event is about joins the trigger scan
// with all its abilities (that is how cascade sees its own cast), and Sythis
// is itself an enchantment spell, so without it Sythis would draw off its own
// cast from the stack. A Sythis already on the battlefield is never the spell
// being cast, so excluding the source loses nothing the card does.
const CAST_TEXT = "Whenever you cast an enchantment spell, you gain 1 life and draw a card.";

export default defineCard({
  name: "Sythis, Harvest's Hand",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Nymph"],
  power: 1,
  toughness: 2,
  text: CAST_TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        otherOnly: true,
        filter: { type: "enchantment" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
