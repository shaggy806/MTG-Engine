import { defineCard } from "../define.js";

export default defineCard({
  name: "Clearwater Pathway",
  colors: [],
  types: ["land"],
  text: "{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
  faces: ["Clearwater Pathway", "Murkwater Pathway"],
});
