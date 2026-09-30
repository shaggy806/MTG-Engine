import { defineCard } from "../define.js";

// Being an artifact is a copy exception (a copy of the token is one too);
// haste isn't, and lasts only this turn.
export default defineCard({
  name: "Molten Duplication",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Create a token that's a copy of target artifact or creature you control, except it's an artifact in addition to its other types. It gains haste until end of turn. Sacrifice it at the beginning of the next end step.",
  targets: [{ kind: "permanent", whose: "you", filter: { typesAnyOf: ["artifact", "creature"] } }],
  effect: {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    exceptions: { addTypes: ["artifact"] },
    gainUntilEndOfTurn: ["haste"],
    sacrificeAtEndStep: true,
  },
});
