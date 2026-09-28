import { defineCard } from "../define.js";

// `create-token-copy` of the destroyed target: after the `destroy` it's in its
// owner's graveyard, and the copy reads it as it last existed on the
// battlefield (the ruling) — its copiable values, its controller then ("its
// controller creates"), and the power and toughness halved. No tokens unless
// it died: indestructible, or a replacement sending it elsewhere, makes none.
export default defineCard({
  name: "Saw in Half",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "Destroy target creature. If that creature dies this way, its controller creates two tokens " +
    "that are copies of that creature, except their power is half that creature's power and their " +
    "toughness is half that creature's toughness. Round up each time.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "died" },
        then: {
          kind: "create-token-copy",
          of: 0,
          count: 2,
          basePt: [
            { half: { powerOf: 0 }, round: "up" },
            { half: { toughnessOf: 0 }, round: "up" },
          ],
        },
      },
    ],
  },
});
