import { defineCard } from "../define.js";

// needed-cards P5b — `create-token-copy` with `of: <target-slot>`. After the
// `destroy` step the creature is in its owner's graveyard; `createTokenCopy`
// reads its (now un-`copyOf`'d) name and its controller — reverted to owner by
// `moveObject`, i.e. its last-known controller ("its controller creates").
// `basePt` pushes a layer-7b set-P/T modifier ("except they're each 1/1").
// Simplification: the "if it had a printed power" gate is dropped (every real
// creature card has one).
export default defineCard({
  name: "Saw in Half",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "Destroy target creature. If it had a printed power, its controller creates two tokens that are copies of that creature, except they're each 1/1.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token-copy", of: 0, count: 2, basePt: [1, 1] },
    ],
  },
});
