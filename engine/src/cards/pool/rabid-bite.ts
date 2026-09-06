import { defineCard } from "../define.js";

export default defineCard({
  name: "Rabid Bite",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Target creature you control deals damage equal to its power to target creature you don't control.",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: { kind: "fight", a: 0, b: 1, oneSided: true },
});
