import { defineCard } from "../define.js";

// "Any number of target creatures you control": none, or as many as you
// choose. They're exiled together and come back together at the next end
// step, under their owners' control — a token exiled this way is gone for
// good (the rulings).
export default defineCard({
  name: "Eerie Interlude",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Exile any number of target creatures you control. Return those cards to the battlefield under their " +
    "owner's control at the beginning of the next end step.",
  targets: [{ kind: "any-number", of: "creature-you-control" }],
  effect: {
    kind: "flicker",
    target: { from: 0 },
    returnAt: "next-end-step",
    returnText: "Return the exiled cards to the battlefield under their owner's control.",
  },
});
