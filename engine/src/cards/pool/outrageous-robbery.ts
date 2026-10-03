import { defineCard } from "../define.js";

// The opponent exiles the cards face down; only the caster may look at them
// (rule 406.3) and play them — lands with the land drop, spells at their
// normal timing (the ruling) — for as long as they stay exiled. The any-type
// spending is only for a spell cast this way (rule 118.14).
const TEXT =
  "Target opponent exiles the top X cards of their library face down. You may look at and play those cards for as long as they remain exiled. If you cast a spell this way, you may spend mana as though it were mana of any type to cast it.";

export default defineCard({
  name: "Outrageous Robbery",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: TEXT,
  targets: ["opponent"],
  effect: {
    kind: "impulse-exile",
    amount: "x",
    whose: 0,
    duration: "while-exiled",
    faceDown: true,
    spendAs: "any-type",
  },
});
