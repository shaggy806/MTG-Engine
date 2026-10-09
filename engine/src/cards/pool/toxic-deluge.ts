import { defineCard } from "../define.js";

/**
 * An `{X}` spell whose X is paid in *life* rather than mana — see
 * `additionalCost.payLifeX`. Its printed mana cost has no `{X}` in it at all,
 * so the choice is offered off the life total instead of what the lands can
 * make, and `"x"` reads it like any other X. "-X/-X" is X with the card's own
 * minus sign (`ptChangeValue`).
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
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature" },
    power: { product: ["x", -1] },
    toughness: { product: ["x", -1] },
    duration: "end-of-turn",
  },
});
