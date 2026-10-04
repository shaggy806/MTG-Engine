import { defineCard } from "../define.js";

// EDHREC rank 3381.
//
// Rulings:
//   [2010-03-01] As another player’s untap step begins, if there are four or more quest counters
//     on Quest for Renewal, all your creatures untap during that untap step. You have no choice
//     about what untaps. Those creatures untap at the same time as the active player’s permanents.
//   [2010-03-01] During another player’s untap step, effects that would otherwise cause your
//     creatures to stay tapped don’t apply because they apply only during *your* untap step.
//   [2010-03-01] Controlling more than one Quest for Renewal with four or more quest counters on
//     it is redundant. You can’t untap your permanents more than once in a single untap step.
//   [2010-03-01] Creatures put onto the battlefield tapped don’t cause Quest for Renewal’s first
//     ability to trigger.

const TAP_TEXT = "Whenever a creature you control becomes tapped, you may put a quest counter on this enchantment.";
const UNTAP_TEXT =
  "As long as there are four or more quest counters on this enchantment, untap all creatures you control during each other player's untap step.";

export default defineCard({
  name: "Quest for Renewal",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${TAP_TEXT}\n${UNTAP_TEXT}`,
  triggered: [
    {
      // Entering tapped isn't becoming tapped (no `permanent-tapped` event).
      trigger: { on: "becomes-tapped", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a quest counter on Quest for Renewal?",
        effect: { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
      },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
  static: [
    {
      // Seedborn Muse's shape, gated on the counters (Beastmaster Ascension).
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "quest", compare: { op: "gte", n: 4 } },
      untapsDuringOthersUntap: { type: "creature" },
      text: UNTAP_TEXT,
    },
  ],
});
