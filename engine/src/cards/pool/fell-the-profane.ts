import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Fell Mire, is
 * a land you play instead. */
export default defineCard({
  name: "Fell the Profane",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature or planeswalker.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
  faces: ["Fell the Profane", "Fell Mire"],
});
