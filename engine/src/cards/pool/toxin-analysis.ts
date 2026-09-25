import { defineCard } from "../define.js";

export default defineCard({
  name: "Toxin Analysis",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gains deathtouch and lifelink until end of turn. Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
