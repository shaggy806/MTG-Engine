import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 4024.
//
// Rulings:
//   [2026-03-20] Unlike some other dual lands, Turbulent Steppe has two basic land types. It's not
//     basic, so effects that search for basic lands can't find it, but it does have the
//     appropriate land types for effects such as that of Furycalm Snarl (included in the Secrets
//     of Strixhaven Commander decks).
//   [2026-03-20] If this land enters the battlefield at the same time as any number of lands your
//     opponents control, those other lands are not counted when determining if this land enters
//     the battlefield tapped or untapped.

export default defineCard({
  name: "Turbulent Steppe",
  types: ["land"],
  subtypes: ["Mountain", "Plains"],
  text:
    "({T}: Add {R} or {W}.)\n" +
    "This land enters tapped unless your opponents control eight or more lands.",
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
      text: "This land enters tapped unless your opponents control eight or more lands.",
    },
  ],
  activated: [manaTapAbility("R"), manaTapAbility("W")],
});
