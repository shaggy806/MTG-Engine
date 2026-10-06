import { defineCard } from "../define.js";

// EDHREC rank 6598.
//
// Rulings:
//   [2025-04-04] If the target permanent is an illegal target as Inevitable Defeat tries to
//     resolve, it won't resolve and none of its effects will happen. No player will gain or lose
//     life.
//
// Exile first, then the life — the printed order. "Its controller" reads the permanent as it last
// existed on the battlefield (rule 608.2h — Swords to Plowshares' shape).
export default defineCard({
  name: "Inevitable Defeat",
  manaCost: "{1}{R}{W}{B}",
  colors: ["W", "B", "R"],
  types: ["instant"],
  text: "This spell can't be countered.\nExile target nonland permanent. Its controller loses 3 life and you gain 3 life.",
  cantBeCountered: true,
  targets: [{ kind: "permanent", filter: { notTypes: ["land"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "lose-life", amount: 3, toControllerOfTarget: 0 },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
