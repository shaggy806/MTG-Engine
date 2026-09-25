import { defineCard } from "../define.js";

export default defineCard({
  name: "Loran's Escape",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Target artifact or creature gains hexproof and indestructible until end of turn. Scry 1.",
  targets: ["artifact-or-creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
          {
            kind: "grant-keyword",
            target: 0,
            keyword: "indestructible",
            duration: "end-of-turn",
          },
        ],
      },
      { kind: "scry", amount: 1 },
    ],
  },
});
