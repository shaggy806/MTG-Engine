import { defineCard } from "../define.js";

export default defineCard({
  name: "Urborg Elf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {B}, {G}, or {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B}, {G}, or {U}.",
    },
  ],
});
