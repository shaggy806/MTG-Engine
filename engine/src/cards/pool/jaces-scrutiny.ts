import { defineCard } from "../define.js";

export default defineCard({
  name: "Jace's Scrutiny",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -4/-0 until end of turn.\nInvestigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -4, toughness: 0, duration: "end-of-turn" },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
