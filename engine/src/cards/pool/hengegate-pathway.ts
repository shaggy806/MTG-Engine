import { defineCard } from "../define.js";

export default defineCard({
  name: "Hengegate Pathway",
  colors: [],
  types: ["land"],
  text: "{T}: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
  faces: ["Hengegate Pathway", "Mistgate Pathway"],
});
