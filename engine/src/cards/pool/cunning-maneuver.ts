import { defineCard } from "../define.js";

export default defineCard({
  name: "Cunning Maneuver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +3/+1 until end of turn.\nCreate a Clue token. (It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 1, duration: "end-of-turn" },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
