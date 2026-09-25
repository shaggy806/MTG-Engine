import { defineCard } from "../define.js";

export default defineCard({
  name: "Elderleaf Mentor",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, create a 1/1 green Elf Warrior creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 green Elf Warrior creature token.",
    },
  ],
});
