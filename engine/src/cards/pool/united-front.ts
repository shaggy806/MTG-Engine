import { defineCard } from "../define.js";

// EDHREC rank 5508.
// Makes Ally → use "Ally Token".

// Two instructions in order: the new Allies are on the battlefield when the
// counters go on, so each of them gets one too.
export default defineCard({
  name: "United Front",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create X 1/1 white Ally creature tokens, then put a +1/+1 counter on each creature you control.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Ally Token", count: "x" },
      { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
    ],
  },
});
