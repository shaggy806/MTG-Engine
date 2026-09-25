import { defineCard } from "../define.js";

export default defineCard({
  name: "Leave in the Dust",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target nonland permanent to its owner's hand.\nDraw a card.",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0 }, { kind: "draw", amount: 1 }],
  },
});
