import { defineCard } from "../define.js";

export default defineCard({
  name: "Barkchannel Pathway",
  colors: [],
  types: ["land"],
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
  faces: ["Barkchannel Pathway", "Tidechannel Pathway"],
});
