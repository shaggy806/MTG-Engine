import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// EDHREC rank 5524.
// Makes Clue → uses "Clue Token".
//
// Hide on the Ceiling's shape: exactly X targets (X chosen first), exiled
// together and returned together, tapped (Nezahal's `tapped`), under their
// owners' control at the next end step. Then investigate X times.

export default defineCard({
  name: "Disorder in the Court",
  manaCost: "{X}{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Exile X target creatures, then investigate X times. Return the exiled cards to the battlefield tapped under their owners' control at the beginning of the next end step. (To investigate, create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: [{ kind: "any-number", of: "creature", min: "x", max: "x" }],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "flicker",
        target: { from: 0 },
        returnAt: "next-end-step",
        tapped: true,
        returnText: "Return the exiled cards to the battlefield tapped under their owners' control.",
      },
      investigate("x"),
    ],
  },
});
