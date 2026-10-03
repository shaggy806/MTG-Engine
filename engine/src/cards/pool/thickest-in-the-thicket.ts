import { defineCard } from "../define.js";

const ENTERS_TEXT =
  "When this enchantment enters, put X +1/+1 counters on target creature, where X is that creature's power.";
const END_TEXT =
  "At the beginning of your end step, draw two cards if you control the creature with the greatest power or " +
  "tied for the greatest power.";

// X is read once, as the first ability resolves (the ruling). The draw's
// "if" isn't an intervening-if: the ability always triggers, and the
// question is asked as it resolves (the ruling) — a `conditional`.
export default defineCard({
  name: "Thickest in the Thicket",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ENTERS_TEXT}\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { powerOf: 0 } },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "controls-greatest", of: "power", filter: { type: "creature" } },
        then: { kind: "draw", amount: 2 },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
