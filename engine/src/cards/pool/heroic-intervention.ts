import { defineCard } from "../define.js";

export default defineCard({
  name: "Heroic Intervention",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Permanents you control gain hexproof and indestructible until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you" },
        keyword: "hexproof",
        duration: "end-of-turn",
      },
      {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
    ],
  },
});
