import { defineCard } from "../define.js";

export default defineCard({
  name: "Deal Gone Bad",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -3/-3 until end of turn. Target player mills three cards. (They put the top three cards of their library into their graveyard.)",
  targets: ["creature", "player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      { kind: "mill", target: 1, amount: 3 },
    ],
  },
});
