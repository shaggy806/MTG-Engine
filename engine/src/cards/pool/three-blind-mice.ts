import { defineCard } from "../define.js";

// EDHREC rank 6715.
//
// Rulings:
//   Only creatures you control at the time the fourth chapter ability resolves will get +1/+1
//     and gain vigilance. Creatures you begin to control later in the turn won't be affected.
//   The token copies the original characteristics of the target token as stated by the effect
//     that created the token.
//   If the copied token is copying something else, then the token enters the battlefield as
//     whatever that token copied.
//
// Chapters II and III are City of Death's / Esika's Chariot's token copy (any
// token you control, Saga or not — this card doesn't exclude one). Chapter IV
// is Preposterous Proportions' shape: both effects lock in the creatures you
// control as it resolves (rule 611.2c).

const COPY_TEXT = "II, III — Create a token that's a copy of target token you control.";
const PUMP_TEXT = "IV — Creatures you control get +1/+1 and gain vigilance until end of turn.";

export default defineCard({
  name: "Three Blind Mice",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.)\n" +
    `I — Create a 1/1 white Mouse creature token.\n${COPY_TEXT}\n${PUMP_TEXT}`,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "create-token", token: "Mouse Token", count: 1 },
      resolve: null,
      text: "I — Create a 1/1 white Mouse creature token.",
    },
    {
      at: [2, 3],
      targets: [{ kind: "permanent", whose: "you", filter: { token: true } }],
      effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      resolve: null,
      text: COPY_TEXT,
    },
    {
      at: [4],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: 1,
            toughness: 1,
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "vigilance",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
