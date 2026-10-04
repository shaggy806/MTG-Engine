import { defineCard } from "../define.js";

// EDHREC rank 4432.
//
// The granted trigger is the creature's own (Idolized's shape), so "you" is
// the creature's controller and "this creature" is `"source"` — the shape the
// granted melee helper uses. "That many" is the life gained (Treebeard's
// `triggerValue`).
//
// Rulings:
//   [2020-06-23] If you gain an amount of life “for each” of something, that life is gained as one
//     event and the ability triggers only once.
//   [2020-06-23] If enchanted creature is dealt lethal damage at the same time that you gain life,
//     it won't receive a counter from its ability in time to save it.
//   [2020-06-23] Each creature with lifelink dealing combat damage causes a separate life-gaining
//     event. For example, if two creatures you control with lifelink deal combat damage at the
//     same time, the ability will trigger twice. However, if a single creature you control with
//     lifelink deals combat damage to multiple creatures, players, and/or planeswalkers at the
//     same time (perhaps because it has trample or was blocked by more than one creature), the
//     ability will trigger only once.

const GRANTED_TEXT = "Whenever you gain life, put that many +1/+1 counters on this creature.";
const STATIC_TEXT = `Enchanted creature has "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Light of Promise",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${STATIC_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [
        {
          trigger: { on: "gains-life", who: "you" },
          targets: [],
          effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: { triggerValue: true } },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
});
