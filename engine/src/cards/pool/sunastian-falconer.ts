import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunastian Falconer",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 4,
  toughness: 4,
  text: "{T}: Add {C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
  ],
});
