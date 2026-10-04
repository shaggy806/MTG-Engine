import { defineCard } from "../define.js";

// EDHREC rank 5379.
//
// Rulings:
//   [2016-07-13] Your opponent can't refuse your generous donation.
// (Zedruu the Greathearted's donate shape: `gain-control` does nothing when
// either target has become illegal, rule 608.2b.)

const TEXT = "Target opponent gains control of target permanent you control.";

export default defineCard({
  name: "Harmless Offering",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["opponent", { kind: "permanent", whose: "you", filter: {} }],
  effect: { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false },
});
