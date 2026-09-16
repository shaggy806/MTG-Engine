import { defineCard } from "../define.js";

export default defineCard({
  name: "Gleaming Overseer",
  manaCost: "{1}{U}{B}",
  colors: ["B", "U"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 1,
  toughness: 4,
  text: "When this creature enters, amass Zombies 1.\nZombie tokens you control have hexproof and menace.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 1, creatureType: "Zombie" },
      resolve: null,
      text: "When this creature enters, amass Zombies 1.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie", tokenOnly: true },
      grantKeywords: ["hexproof", "menace"],
      text: "Zombie tokens you control have hexproof and menace.",
    },
  ],
});
