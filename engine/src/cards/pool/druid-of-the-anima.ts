import { defineCard } from "../define.js";

export default defineCard({
  name: "Druid of the Anima",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {R}, {G}, or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R}, {G}, or {W}.",
    },
  ],
});
