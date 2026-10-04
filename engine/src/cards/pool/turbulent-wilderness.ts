import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 3974.
//
// Rulings:
//   [2026-03-20] If this land enters the battlefield at the same time as any number of lands your
//     opponents control, those other lands are not counted when determining if this land enters
//     the battlefield tapped or untapped.
//   [2026-03-20] Unlike some other dual lands, Turbulent Wilderness has two basic land types. It's
//     not basic, so effects that search for basic lands can't find it, but it does have the
//     appropriate land types for effects such as that of Vineglimmer Snarl (included in the
//     Secrets of Strixhaven Commander decks).

export default defineCard({
  name: "Turbulent Wilderness",
  colors: [],
  types: ["land"],
  subtypes: ["Forest", "Island"],
  text: "({T}: Add {G} or {U}.)\nThis land enters tapped unless your opponents control eight or more lands.",
  // Turbulent Fen's shape: the opponents' lands are counted as it would enter,
  // so lands entering beside it aren't (its ruling).
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
  activated: [manaTapAbility("G"), manaTapAbility("U")],
});
