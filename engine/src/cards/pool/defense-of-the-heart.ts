import { defineCard } from "../define.js";

// needed-cards P7 — the card the intervening-if work was built for. All three
// pieces are new: an `opponent-controls` `StaticCondition`, a triggered
// ability's `condition` (rule 603.4 — checked at your upkeep *and* again on
// resolution, so an opponent sacrificing a creature in response saves your
// enchantment), and a `sacrifice-source` effect whose `then` is the "if you
// do" tail.
export default defineCard({
  name: "Defense of the Heart",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "At the beginning of your upkeep, if an opponent controls three or more creatures, " +
    "sacrifice Defense of the Heart. If you do, search your library for up to two creature cards, " +
    "put them onto the battlefield, then shuffle.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: {
        kind: "opponent-controls",
        filter: { type: "creature" },
        atLeast: 3,
      },
      targets: [],
      effect: {
        kind: "sacrifice-source",
        then: {
          kind: "search-library",
          filter: { type: "creature" },
          destination: "battlefield",
          min: 0,
          max: 2,
        },
      },
      resolve: null,
      text:
        "At the beginning of your upkeep, if an opponent controls three or more creatures, " +
        "sacrifice Defense of the Heart. If you do, search your library for up to two creature " +
        "cards, put them onto the battlefield, then shuffle.",
    },
  ],
});
