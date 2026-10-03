import { defineCard } from "../define.js";

// With either target illegal as it resolves, no damage is dealt (rule
// 608.2b). "You don't control" is an opponent's: a free-for-all table has no
// teammates.
export default defineCard({
  name: "Bite Down",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature you control deals damage equal to its power to target creature or planeswalker you don't control.",
  targets: [
    "creature-you-control",
    { kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } },
  ],
  effect: { kind: "fight", a: 0, b: 1, oneSided: true },
});
