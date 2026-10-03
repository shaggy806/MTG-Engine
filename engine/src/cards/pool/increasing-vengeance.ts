import { defineCard } from "../define.js";

// The rulings this follows: any instant or sorcery spell you control, with
// targets or not; each copy may get new targets of its own, and has the
// spell's modes, X and what was paid for it. "Cast from a graveyard" is any
// way of casting it from there, flashback or another; a copy of this spell
// was never cast, so it copies once.
export default defineCard({
  name: "Increasing Vengeance",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Copy target instant or sorcery spell you control. If this spell was cast from a graveyard, copy that " +
    "spell twice instead. You may choose new targets for the copies.\n" +
    "Flashback {3}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  flashback: { cost: "{3}{R}{R}" },
  targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: {
    kind: "copy-spell",
    target: 0,
    newTargets: true,
    count: { ifCondition: { kind: "source", filter: { castFrom: "graveyard" } }, then: 2, else: 1 },
  },
});
