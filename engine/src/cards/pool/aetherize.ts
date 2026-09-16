import { defineCard } from "../define.js";

export default defineCard({
  name: "Aetherize",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return all attacking creatures to their owner's hand.",
  effect: {
    kind: "return-to-hand-all",
    filter: { type: "creature", attacking: true },
  },
});
