import { defineCard } from "../define.js";

export default defineCard({
  name: "Splatter Goblin",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Goblin"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, target creature an opponent controls gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature dies, target creature an opponent controls gets -1/-1 until end of turn.",
    },
  ],
});
