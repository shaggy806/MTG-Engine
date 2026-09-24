import { defineCard } from "../define.js";

// Top-commanders rank 353. A `deals-damage` trigger on noncombat damage from
// a source you control to an opponent — a spell, a permanent, or an
// ability's source — once per opponent per damage event, drawing the amount
// actually dealt (prevented damage isn't dealt, so it draws nothing).
const DRAW_TEXT =
  "Whenever a source you control deals noncombat damage to an opponent, you draw that many cards.";

export default defineCard({
  name: "Niv-Mizzet, Visionary",
  manaCost: "{4}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Wizard"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\nYou have no maximum hand size.\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      noMaxHandSize: true,
      text: "You have no maximum hand size.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "you-control", to: "opponent", combat: false },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
