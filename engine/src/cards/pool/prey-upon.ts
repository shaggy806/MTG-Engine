import { defineCard } from "../define.js";

export default defineCard({
  name: "Prey Upon",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Target creature you control fights target creature you don't control.",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: { kind: "fight", a: 0, b: 1 },
});
