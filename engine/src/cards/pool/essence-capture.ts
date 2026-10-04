import { defineCard } from "../define.js";

// EDHREC rank 5817.
//
// Rulings:
//   [2019-01-25] You can't cast Essence Capture without a target creature spell. If either target
//     is illegal when Essence Capture tries to resolve, the other is still affected as
//     appropriate.
//   [2019-01-25] A creature spell that can't be countered is a legal target for Essence Capture.
//     The spell won't be countered when Essence Capture resolves, but you'll still put a +1/+1
//     counter on the target creature.

export default defineCard({
  name: "Essence Capture",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target creature spell. Put a +1/+1 counter on up to one target creature you control.",
  targets: ["creature-spell", { kind: "optional", of: "creature-you-control" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
    ],
  },
});
