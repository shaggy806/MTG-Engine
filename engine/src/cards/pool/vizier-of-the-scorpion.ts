import { defineCard } from "../define.js";

export default defineCard({
  name: "Vizier of the Scorpion",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, amass Zombies 1.\nZombie tokens you control have deathtouch.",
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
      grantKeywords: ["deathtouch"],
      text: "Zombie tokens you control have deathtouch.",
    },
  ],
});
