import { defineCard } from "../define.js";

// Top-commanders rank 272. Every clause is existing vocabulary:
//
// - "Whenever you cast a creature spell" — Sythis, Harvest's Hand's shape, a
//   `cast-spell` trigger with a type filter read off the spell on the stack.
//   `otherOnly` is rule 113.6 rather than an added "another": the spell a
//   `spell-cast` event is about joins the trigger scan with all of its
//   abilities (that is how cascade sees its own cast), and Chulane is itself a
//   creature spell, so without it Chulane would draw off its own cast from the
//   stack — where its ability doesn't function at all. A Chulane already on
//   the battlefield is never the spell being cast, so excluding the source
//   loses nothing the card does.
// - "draw a card, then you may put a land card from your hand onto the
//   battlefield" — Growth Spiral's `sequence` of a draw and a `zone: "hand"`
//   `look-and-choose`, in that order, so the card just drawn is one of the
//   ones you may put down. `min: 0` is the "you may" and `leftover: "stay"`
//   leaves the rest of the hand alone. That effect puts the land onto the
//   battlefield rather than *playing* it, which is the 2019-10-04 ruling: it
//   doesn't use the land drop and works on anyone's turn.
// - "{3}, {T}: Return target creature you control to its owner's hand" — no
//   `otherOnly`; the printed ability may bounce Chulane itself.
const CAST_TEXT =
  "Whenever you cast a creature spell, draw a card, then you may put a land card from your hand onto the battlefield.";
const BOUNCE_TEXT = "{3}, {T}: Return target creature you control to its owner's hand.";

export default defineCard({
  name: "Chulane, Teller of Tales",
  manaCost: "{2}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\n" + CAST_TEXT + "\n" + BOUNCE_TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "look-and-choose",
            zone: "hand",
            min: 0,
            max: 1,
            destination: "battlefield",
            leftover: "stay",
            filter: { type: "land" },
          },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
});
