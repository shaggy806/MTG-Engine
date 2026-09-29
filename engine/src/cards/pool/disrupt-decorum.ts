import { defineCard } from "../define.js";

// The creatures there as it resolves; one arriving later isn't goaded (the
// ruling).
export default defineCard({
  name: "Disrupt Decorum",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Goad all creatures you don't control. (Until your next turn, those creatures attack each combat if able and attack a player other than you if able.)",
  effect: { kind: "goad", filter: { type: "creature", controlledBy: "opponent" } },
});
