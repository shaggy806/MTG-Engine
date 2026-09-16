import { defineCard } from "../define.js";

export default defineCard({
  name: "Eternal Skylord",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, amass Zombies 2.\nZombie tokens you control have flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 2, creatureType: "Zombie" },
      resolve: null,
      text: "When this creature enters, amass Zombies 2.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie", tokenOnly: true },
      grantKeywords: ["flying"],
      text: "Zombie tokens you control have flying.",
    },
  ],
});
