import { defineCard } from "../define.js";
import { outlast } from "../helpers.js";

// EDHREC rank 2494.
//
// Rulings:
//   [2024-06-07] The cost to activate a creature's outlast ability includes the tap symbol ({T}).
//     Envoy of the Ancestors's outlast ability can't be activated unless it has been under your
//     control continuously since the beginning of your turn.
//   [2024-06-07] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.
//   [2024-06-07] An Aura controlled by another player does not cause a creature you control to be
//     modified.
//   [2024-06-07] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.

const LIFELINK_TEXT = "Modified creatures you control have lifelink.";

export default defineCard({
  name: "Envoy of the Ancestors",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 3,
  text: `Outlast {W} ({W}, {T}: Put a +1/+1 counter on this creature. Outlast only as a sorcery.)\n${LIFELINK_TEXT}`,
  activated: [outlast("{W}")],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", modified: true } },
      grantKeywords: ["lifelink"],
      text: LIFELINK_TEXT,
    },
  ],
});
