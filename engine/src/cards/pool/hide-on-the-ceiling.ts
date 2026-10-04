import { defineCard } from "../define.js";

// EDHREC rank 4072.
//
// Rulings:
//   [2025-09-19] If a double-faced card is exiled this way, it will return to the battlefield with
//     its front face up, regardless of which face was up when it was exiled.

export default defineCard({
  name: "Hide on the Ceiling",
  manaCost: "{X}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile X target artifacts and/or creatures. Return the exiled cards to the battlefield under their owners' control at the beginning of the next end step.",
  // Exactly X targets, X chosen first (Curse of the Swine's group), exiled
  // together and returned together at the next end step under their owners'
  // control (Eerie Interlude's flicker). A token exiled this way is gone.
  targets: [{ kind: "any-number", of: "artifact-or-creature", min: "x", max: "x" }],
  effect: {
    kind: "flicker",
    target: { from: 0 },
    returnAt: "next-end-step",
    returnText: "Return the exiled cards to the battlefield under their owners' control.",
  },
});
