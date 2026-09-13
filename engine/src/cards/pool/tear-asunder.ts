import { defineCard } from "../define.js";

// needed-cards P8 — the kicker card. Kicker is announced as the spell is cast
// (rule 601.2b), *before* targets are chosen, which matters here: kicked, the
// spell targets any permanent rather than only an artifact or enchantment, so
// the legal target list itself depends on the choice. `legalActions` therefore
// offers Tear Asunder twice, unkicked and kicked, each with its own cost and
// target options.
export default defineCard({
  name: "Tear Asunder",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Kicker {1}{B}\n" +
    "Exile target artifact or enchantment. If this spell was kicked, instead " +
    "exile target nonland permanent.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "exile", target: 0 },
  kicker: {
    cost: "{1}{B}",
    targets: ["nonland-permanent"],
    effect: { kind: "exile", target: 0 },
  },
});
