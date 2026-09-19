import { defineCard } from "../define.js";

/**
 * An `{X}` spell whose X is paid in *life* rather than mana — see
 * `additionalCost.payLifeX`. Its printed mana cost has no `{X}` in it at all,
 * so the choice is offered off the life total instead of what the lands can
 * make, and `ctx.x` reads it like any other X.
 *
 * The `-X/-X` goes through the imperative hatch: `EffectAmount` has no
 * negated form, and inventing one for a single card would be worse than
 * four lines of script.
 */
export default defineCard({
  name: "Toxic Deluge",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "As an additional cost to cast this spell, pay X life.\n" +
    "All creatures get -X/-X until end of turn.",
  additionalCost: { payLifeX: true },
  resolve: (ctx) => {
    ctx.modifyPtAll({ type: "creature" }, -ctx.x, -ctx.x, "end-of-turn");
  },
});
