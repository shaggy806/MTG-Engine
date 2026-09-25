import { defineCard } from "../define.js";

export default defineCard({
  name: "Needleverge Pathway",
  colors: [],
  types: ["land"],
  text: "{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  faces: ["Needleverge Pathway", "Pillarverge Pathway"],
});
