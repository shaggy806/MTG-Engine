import { defineCard } from "../define.js";

// Commander backlog #150 (top-commanders.txt).
//
// Krenko, Mob Boss's shape with a Rat sacrificed on top, plus a Rat lord that
// isn't scoped to you.
//
// - "**All** Rats have fear" — everyone's Rats, the opponents' included, which
//   is what the `all-creatures` scope is for. Marrow-Gnawer is a Rat, so it
//   has fear itself.
// - "Sacrifice a Rat" — any Rat you control, Marrow-Gnawer included (no
//   "another"), so no `otherOnly`. A Rat token sacrificed out of a compacted
//   stack is split off it first.
// - X is counted as the ability *resolves*, so the Rat sacrificed to pay for
//   it is already gone and isn't counted (2004-12-01 ruling). The count is of
//   Rat permanents rather than objects, so a stack of Rat tokens counts as
//   every token in it.
export default defineCard({
  name: "Marrow-Gnawer",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Rogue"],
  power: 2,
  toughness: 3,
  text:
    "All Rats have fear.\n" +
    "{T}, Sacrifice a Rat: Create X 1/1 black Rat creature tokens, where X is the number of Rats you control.",
  static: [
    {
      affects: { scope: "all-creatures", subtype: "Rat" },
      grantKeywords: ["fear"],
      text: "All Rats have fear.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Rat" } } },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Rat Token",
        count: { countOf: { subtype: "Rat", controlledBy: "you" } },
      },
      resolve: null,
      text:
        "{T}, Sacrifice a Rat: Create X 1/1 black Rat creature tokens, where X is the number of Rats you control.",
    },
  ],
});
