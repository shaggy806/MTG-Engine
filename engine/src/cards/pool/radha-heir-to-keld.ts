import { defineCard } from "../define.js";

export default defineCard({
  name: "Radha, Heir to Keld",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: "Whenever Radha attacks, you may add {R}{R}.\n{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Add {R}{R}?",
        effect: { kind: "add-mana", mana: "R", amount: 2 },
      },
      resolve: null,
      text: "Whenever Radha attacks, you may add {R}{R}.",
    },
  ],
});
