import { defineCard } from "../define.js";

// The greatest power is read as the Expertise resolves; the free spell is
// cast while it is still resolving (rule 608.2g), and may be one of the
// cards just drawn (the rulings).
const TEXT =
  "Draw cards equal to the greatest power among creatures you control.\n" +
  "You may cast a spell with mana value 5 or less from your hand without paying its mana cost.";

export default defineCard({
  name: "Rishkar's Expertise",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "draw",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
      },
      { kind: "cast-now", from: "hand", free: true, spell: { manaValue: { op: "lte", n: 5 } } },
    ],
  },
});
