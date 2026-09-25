import { defineCard } from "../define.js";

export default defineCard({
  name: "Lost in a Labyrinth",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -3/-0 until end of turn. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" },
      { kind: "scry", amount: 1 },
    ],
  },
});
