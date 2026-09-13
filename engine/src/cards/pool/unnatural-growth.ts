import { defineCard } from "../define.js";

/**
 * `double-pt-all` — reads each matching permanent's *own* current computed
 * power/toughness and adds that much again (a documented former gap — see
 * World War Hulk's dropped chapter III in `neededCards-features.md`: "every
 * existing P/T effect adds an independent amount, none reads and transforms
 * the current value"). `who: "any"` fires this every combat, not just the
 * controller's own.
 */
export default defineCard({
  name: "Unnatural Growth",
  manaCost: "{1}{G}{G}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "At the beginning of each combat, double the power and toughness of each creature you control until end of turn.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "any" },
      targets: [],
      effect: {
        kind: "double-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        duration: "end-of-turn",
      },
      resolve: null,
      text: "At the beginning of each combat, double the power and toughness of each creature you control until end of turn.",
    },
  ],
});
