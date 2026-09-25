import { defineCard } from "../define.js";

export default defineCard({
  name: "Llanowar Dead",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Zombie", "Elf"],
  power: 2,
  toughness: 2,
  text: "{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
});
