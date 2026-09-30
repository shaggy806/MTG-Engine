import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Khalni
 * Territory, is a land you play instead. */
export default defineCard({
  name: "Khalni Ambush",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Target creature you control fights target creature you don't control. (Each deals damage equal to its power to the other.)",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: { kind: "fight", a: 0, b: 1 },
  faces: ["Khalni Ambush", "Khalni Territory"],
});
