import { defineCard } from "../define.js";

export default defineCard({
  name: "Fyndhorn Elder",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Add {G}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: "{T}: Add {G}{G}.",
    },
  ],
});
