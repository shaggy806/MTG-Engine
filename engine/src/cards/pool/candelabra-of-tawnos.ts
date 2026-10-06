import { defineCard } from "../define.js";

// EDHREC rank 6593.
//
// Rulings:
//   [2004-10-04] This is not mana ability. It is a normal ability and it will resolve along with
//     other spells and abilities on the stack. The lands untap during resolution.
//   [2004-10-04] Can be used on an untapped land.
//   [2004-10-04] You may untap your opponent's lands if desired.
//
// Exactly X targets, X announced first (rule 601.2b–c) — Magus of the Candelabra's shape.
const TEXT = "{X}, {T}: Untap X target lands.";

export default defineCard({
  name: "Candelabra of Tawnos",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{X}", tap: true },
      targets: [{ kind: "any-number", of: "land", min: "x", max: "x" }],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "untap", target: 0 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
