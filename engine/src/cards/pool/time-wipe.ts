import { defineCard } from "../define.js";

export default defineCard({
  name: "Time Wipe",
  manaCost: "{2}{W}{W}{U}",
  colors: ["W", "U"],
  types: ["sorcery"],
  text: "Return a creature you control to its owner's hand, then destroy all creatures.",
  // Not a *target* on the printed card — the choice is made on resolution —
  // but the shape is identical and choosing on cast is the engine's only
  // way to name one creature. Recorded in AUTHORING §15.
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "destroy-all", filter: { type: "creature" } },
    ],
  },
});
