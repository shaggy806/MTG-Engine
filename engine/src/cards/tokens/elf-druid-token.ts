import { defineCard } from "../define.js";

// Freyalise, Llanowar's Fury's Elf Druid token: a 1/1 green Elf Druid with
// "{T}: Add {G}."
export default defineCard({
  name: "Elf Druid Token",
  art: "348b9211-e189-4c62-abdd-9778cfb84e16",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
});
