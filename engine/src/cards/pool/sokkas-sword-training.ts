import { defineCard } from "../define.js";

export default defineCard({
  name: "Sokka's Sword Training",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "Target creature gets +2/+2 until end of turn.\nCreate a Clue token. (It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
