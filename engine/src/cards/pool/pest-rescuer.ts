import { defineCard } from "../define.js";

// EDHREC rank 6409.
// Makes Pest → use "Pest Token".
//
// Rulings:
//   [2026-03-20] Pest Rescuer's first ability checks at the moment it would trigger to see if you
//     control any Pest creature tokens. If you do, the ability won't trigger at all. If it does
//     trigger, the ability will check again as it tries to resolve. If you control any Pest
//     creature tokens at that time, the ability won't resolve and none of its effects will happen.
//   [2026-03-20] If you gain an amount of life "for each" of something or "equal to the number" of
//     something, that life is gained as one event and the last ability of Pest Rescuer applies
//     only once.
//   [2026-03-20] Each creature with lifelink dealing combat damage causes a separate life-gaining
//     event. For example, if two creatures you control with lifelink deal combat damage at the
//     same time, Pest Rescuer's last ability will apply twice. However, if a single creature you
//     control with lifelink deals combat damage to multiple creatures, players, planeswalkers,
//     and/or battles at the same time (perhaps because it has trample or was blocked by more than
//     one creature), the ability will apply only once.
//   [2026-03-20] If you control two Pest Rescuers and you would gain life, you gain that much life
//     plus 2. A third Pest Rescuer has you gain that much life plus 3, and so on.

const UPKEEP_TEXT =
  "At the beginning of each upkeep, if you don't control a Pest creature token, create a 1/1 black and green Pest creature token with \"When this token dies, you gain 1 life.\"";
const GAIN_TEXT = "If you would gain life, you gain that much life plus 1 instead.";

export default defineCard({
  name: "Pest Rescuer",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad", "Druid"],
  power: 2,
  toughness: 2,
  text: `${UPKEEP_TEXT}\n${GAIN_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      // Ophiomancer's intervening-if.
      condition: {
        kind: "not",
        of: { kind: "controls", filter: { type: "creature", subtype: "Pest", token: true }, atLeast: 1 },
      },
      targets: [],
      effect: { kind: "create-token", token: "Pest Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "you", plus: 1 },
      text: GAIN_TEXT,
    },
  ],
});
