import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 3715. Turbulent Fen's shape.
//
// Rulings:
//   [2026-03-20] Unlike some other dual lands, Turbulent Moor has two basic land types. It's not
//     basic, so effects that search for basic lands can't find it, but it does have the
//     appropriate land types for effects such as that of Shineshadow Snarl.
//   [2026-03-20] If this land enters the battlefield at the same time as any number of lands your
//     opponents control, those other lands are not counted when determining if this land enters
//     the battlefield tapped or untapped.

const TAPPED_TEXT = "This land enters tapped unless your opponents control eight or more lands.";

export default defineCard({
  name: "Turbulent Moor",
  colors: [],
  types: ["land"],
  subtypes: ["Plains", "Swamp"],
  text: `({T}: Add {W} or {B}.)\n${TAPPED_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: {
          kind: "opponents-control-total",
          filter: { type: "land" },
          atLeast: 8,
        },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [manaTapAbility("W"), manaTapAbility("B")],
});
