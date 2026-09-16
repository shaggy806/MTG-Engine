import { defineCard } from "../define.js";

export default defineCard({
  name: "Lazotep Reaver",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Beast"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, amass Zombies 1.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 1, creatureType: "Zombie" },
      resolve: null,
      text: "When this creature enters, amass Zombies 1.",
    },
  ],
});
