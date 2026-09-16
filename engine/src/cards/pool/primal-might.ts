import { defineCard } from "../define.js";

export default defineCard({
  name: "Primal Might",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Target creature you control gets +X/+X until end of turn. Then it fights up to one target creature you don't control.",
  targets: [
    "creature-you-control",
    // "up to one" — the pump still happens with the fight slot left empty.
    { kind: "optional", of: "creature-an-opponent-controls" },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: "x", toughness: "x", duration: "end-of-turn" },
      { kind: "fight", a: 0, b: 1 },
    ],
  },
});
