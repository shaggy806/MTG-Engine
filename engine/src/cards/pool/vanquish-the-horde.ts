import { defineCard } from "../define.js";

export default defineCard({
  name: "Vanquish the Horde",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "This spell costs {1} less to cast for each creature on the battlefield.\nDestroy all creatures.",
  selfCostReduction: {
    // Unconditional, counting every player's creatures (Blasphemous Act).
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "creature" } },
  },
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
