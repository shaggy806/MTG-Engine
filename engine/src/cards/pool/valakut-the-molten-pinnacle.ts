import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const TRIGGER_TEXT =
  "Whenever a Mountain you control enters, if you control at least five other Mountains, you may have this land deal 3 damage to any target.";

// Intervening "if", asked as it triggers and again as it resolves, of the
// Mountains other than the one that entered — those entering alongside it
// count (the rulings). The target is chosen as it triggers; whether to deal
// the damage, as it resolves.
export default defineCard({
  name: "Valakut, the Molten Pinnacle",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${TRIGGER_TEXT}\n{T}: Add {R}.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Mountain" } },
      condition: {
        kind: "controls",
        filter: { subtype: "Mountain" },
        atLeast: 5,
        excludeTriggerObject: true,
      },
      targets: ["any-target"],
      effect: {
        kind: "may",
        prompt: "Deal 3 damage to the target?",
        effect: { kind: "damage", amount: 3, target: 0 },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  activated: [manaTapAbility("R")],
});
