import { defineCard } from "../define.js";

export default defineCard({
  name: "Nantuko Elder",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 1,
  toughness: 2,
  text: "{T}: Add {C}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["C", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {C}{G}.",
    },
  ],
});
