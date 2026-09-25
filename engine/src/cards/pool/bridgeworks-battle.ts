import { defineCard } from "../define.js";

export default defineCard({
  name: "Bridgeworks Battle",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Target creature you control gets +2/+2 until end of turn. It fights up to one target creature you don't control. " +
    "(Each deals damage equal to its power to the other.)",
  targets: ["creature-you-control", { kind: "optional", of: "creature-an-opponent-controls" }],
  // With the second target skipped or gone, the pump still happens and
  // nothing fights (rulings).
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      { kind: "fight", a: 0, b: 1 },
    ],
  },
  faces: ["Bridgeworks Battle", "Tanglespan Bridgeworks"],
});
