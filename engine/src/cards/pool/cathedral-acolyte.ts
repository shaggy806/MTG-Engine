import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 6470.
//
// Rulings:
//   [2024-03-08] The effect of Cathedral Acolyte's first ability applies to any creature you
//     control with a counter on it, not just ones with +1/+1 counters.
//   [2024-03-08] Once a creature's ward ability has triggered, causing that creature to lose ward
//     by removing Cathedral Acolyte won't affect the ability.
//
// A granted ward is a real triggered ability (Coppercoat Vanguard's shape).
// A bare "with a counter on it" counts every kind (`counters` with no kind).
const WARD_TEXT = "Each creature you control with a counter on it has ward {1}.";
const TAP_TEXT = "{T}: Put a +1/+1 counter on target creature that entered this turn.";

export default defineCard({
  name: "Cathedral Acolyte",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 2,
  text: `${WARD_TEXT} (Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {1}.)\n${TAP_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } },
      },
      grantsTriggered: [ward({ mana: "{1}" })],
      text: WARD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", enteredThisTurn: true } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
