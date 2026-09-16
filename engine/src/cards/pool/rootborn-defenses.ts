import { defineCard } from "../define.js";

export default defineCard({
  name: "Rootborn Defenses",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Populate. Creatures you control gain indestructible until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "populate" },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
    ],
  },
});
