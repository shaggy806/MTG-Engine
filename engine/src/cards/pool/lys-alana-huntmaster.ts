import { defineCard } from "../define.js";

export default defineCard({
  name: "Lys Alana Huntmaster",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 3,
  text: "Whenever you cast an Elf spell, you may create a 1/1 green Elf Warrior creature token.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Elf" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 green Elf Warrior creature token?",
        effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      },
      resolve: null,
      text: "Whenever you cast an Elf spell, you may create a 1/1 green Elf Warrior creature token.",
    },
  ],
});
