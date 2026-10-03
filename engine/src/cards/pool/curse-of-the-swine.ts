import { defineCard } from "../define.js";

const TEXT =
  "Exile X target creatures. For each creature exiled this way, its controller creates a 2/2 green Boar creature token.";

// Exactly X targets, X chosen first (rule 601.2b–c): an "any number of" group
// fixed at X (`min`/`max: "x"`). One exile of all of them, then a Boar for
// each one that was exiled, made by its controller as it left — one that's
// an illegal target by then isn't exiled and makes no Boar.
export default defineCard({
  name: "Curse of the Swine",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "any-number", of: "creature", min: "x", max: "x" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "for-each-target", from: 0, effect: { kind: "exile", target: 0 }, simultaneous: true },
      {
        kind: "create-token",
        token: "Boar Token",
        who: "each-player",
        count: { thisWay: "exiled", who: "each" },
      },
    ],
  },
});
