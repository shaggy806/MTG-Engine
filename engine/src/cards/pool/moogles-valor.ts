import { defineCard } from "../define.js";

// EDHREC rank 4414.

export default defineCard({
  name: "Moogles' Valor",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "For each creature you control, create a 1/2 white Moogle creature token with lifelink. Then creatures you control gain indestructible until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "create-token",
        token: "Moogle Token",
        count: { countOf: { type: "creature", controlledBy: "you" } },
      },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
    ],
  },
});
