import { defineCard } from "../define.js";

export default defineCard({
  name: "Festering Goblin",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Goblin"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, target creature gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature dies, target creature gets -1/-1 until end of turn.",
    },
  ],
});
