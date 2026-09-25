import { defineCard } from "../define.js";

export default defineCard({
  name: "Blightsoil Druid",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 2,
  text: "{T}, Pay 1 life: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {G}.",
    },
  ],
});
