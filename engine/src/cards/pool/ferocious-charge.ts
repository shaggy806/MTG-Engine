import { defineCard } from "../define.js";

export default defineCard({
  name: "Ferocious Charge",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +4/+4 until end of turn. Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 4, toughness: 4, duration: "end-of-turn" },
      { kind: "scry", amount: 2 },
    ],
  },
});
