import { defineCard } from "../define.js";

/**
 * A demo card for the modal ("choose one") primitive — ROADMAP Phase 1c.
 * Its modes are deliberately all non-targeted: targeted modal spells (most
 * real charms) need cast-time mode selection, which this engine doesn't do
 * yet. See the `modal` `EffectSpec` and ROADMAP Phase 1c / 6.
 */
export default defineCard({
  name: "Deliberate Course",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Choose one —\n• Draw two cards.\n• You gain 5 life.\n• Proliferate.",
  effect: {
    kind: "modal",
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "Draw two cards.", effect: { kind: "draw", amount: 2 } },
      { text: "You gain 5 life.", effect: { kind: "gain-life", amount: 5 } },
      { text: "Proliferate.", effect: { kind: "proliferate" } },
    ],
  },
});
