import { defineCard } from "../define.js";

// The lands are chosen as it resolves, any player's — not targets (the
// ruling).
export default defineCard({
  name: "Snap",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target creature to its owner's hand. Untap up to two lands.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 2,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to two lands",
      },
    ],
  },
});
