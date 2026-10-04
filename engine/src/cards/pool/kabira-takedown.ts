import { defineCard } from "../define.js";

// EDHREC rank 2613. Modal double-faced: the back face is Kabira Plateau
// (kabira-plateau.ts).
// The count is read as it resolves.

const TEXT =
  "Kabira Takedown deals damage equal to the number of creatures you control to target creature or planeswalker.";

export default defineCard({
  name: "Kabira Takedown",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: TEXT,
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "damage", target: 0, amount: { countOf: { type: "creature", controlledBy: "you" } } },
  faces: ["Kabira Takedown", "Kabira Plateau"],
});
