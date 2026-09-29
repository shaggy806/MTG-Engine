import { defineCard } from "../define.js";

// The Citizens are made first, so they gain indestructible too.
export default defineCard({
  name: "Grand Crescendo",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Create X 1/1 green and white Citizen creature tokens. Creatures you control gain indestructible until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Citizen Token", count: "x" },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
    ],
  },
});
