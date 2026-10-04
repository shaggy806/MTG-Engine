import { defineCard } from "../define.js";

// EDHREC rank 6245.
//
// Rulings:
//   [2019-05-03] You can cast Bond of Discipline even if your opponents control no creatures or
//     you control no creatures. The creatures that are on the battlefield will be affected as
//     appropriate.

export default defineCard({
  name: "Bond of Discipline",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Tap all creatures your opponents control. Creatures you control gain lifelink until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "tap-all", filter: { type: "creature", controlledBy: "opponent" } },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "lifelink",
        duration: "end-of-turn",
      },
    ],
  },
});
