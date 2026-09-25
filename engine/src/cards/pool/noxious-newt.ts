import { defineCard } from "../define.js";

export default defineCard({
  name: "Noxious Newt",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Salamander"],
  power: 1,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch\n{T}: Add {G}.",
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
