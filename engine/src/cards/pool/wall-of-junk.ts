import { defineCard } from "../define.js";

// EDHREC rank 6068.
//
// Rulings:
//   [2004-10-04] It only returns to owner's hand if it is still on the battlefield at end of
//     combat.
//
// A delayed trigger at the next end of combat step (rule 511.2) keyed to this
// permanent: one that has left the battlefield since isn't returned, even if
// it came back (rule 400.7 — Sakashima the Impostor's shape).
const BLOCK_TEXT = "When this creature blocks, return it to its owner's hand at end of combat.";

export default defineCard({
  name: "Wall of Junk",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 7,
  keywords: ["defender"],
  text: `Defender (This creature can't attack.)\n${BLOCK_TEXT} (Return it only if it's on the battlefield.)`,
  triggered: [
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "end-of-combat",
        effect: { kind: "return-to-hand", target: "source" },
        text: "Return Wall of Junk to its owner's hand.",
      },
      resolve: null,
      text: BLOCK_TEXT,
    },
  ],
});
