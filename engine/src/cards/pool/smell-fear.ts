import { defineCard } from "../define.js";

// EDHREC rank 4115.
//
// Rulings:
//   [2021-06-18] You cannot cast Smell Fear without any targets just to proliferate. You must
//     choose at least one creature you control as a target to cast this spell. If you don't
//     choose a creature you don't control as a target, no fight will occur.
//   [2021-06-18] If you choose two creatures as targets with this spell and only one target is
//     legal as the spell resolves, no fight will occur and no damage will be dealt, but you will
//     still proliferate.
//   [2021-06-18] If all targets are illegal as Smell Fear tries to resolve, it doesn't resolve and
//     you will not proliferate.
// Bridgeworks Battle's fight shape: `fight` does nothing with either slot
// empty or illegal.

export default defineCard({
  name: "Smell Fear",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)\nTarget creature you control fights up to one target creature you don't control.",
  targets: ["creature-you-control", { kind: "optional", of: "creature-an-opponent-controls" }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "proliferate" }, { kind: "fight", a: 0, b: 1 }],
  },
});
