import { defineCard } from "../define.js";

export default defineCard({
  name: "Llanowar Tribe",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 3,
  text: "{T}: Add {G}{G}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 3 },
      resolve: null,
      text: "{T}: Add {G}{G}{G}.",
    },
  ],
});
