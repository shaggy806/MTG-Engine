import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Assault Team",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 4,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\nWhen this creature dies, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this creature dies, put a +1/+1 counter on target creature you control.",
    },
  ],
});
