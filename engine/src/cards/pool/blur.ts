import { defineCard } from "../define.js";

export default defineCard({
  name: "Blur",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under its owner's control.\nDraw a card.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "flicker", target: 0 },
      { kind: "draw", amount: 1 },
    ],
  },
});
