import { defineCard } from "../define.js";

// EDHREC rank 4120.
//
// Rulings:
//   [2024-07-26] A permanent that loses all abilities because of Azure Beastbinder's last ability
//     may later gain abilities.
//   [2024-07-26] Azure Beastbinder's last ability overwrites all previous effects that set the
//     creature's base power and toughness to specific values. Any power- or toughness-setting
//     effects that start to apply afterward will overwrite this effect.
//   [2024-07-26] Once Azure Beastbinder has been blocked, increasing the blocking creature's power
//     to 2 or greater won't cause Azure Beastbinder to become unblocked.
//   [2024-07-26] Effects that modify the creature's power and/or toughness, such as the effect of
//     Overprotect, will apply to the creature no matter when they started to take effect. The same
//     is true for counters that change its power and/or toughness and effects that switch its
//     power and toughness.

const EVASION_TEXT = "This creature can't be blocked by creatures with power 2 or greater.";
const ATTACK_TEXT =
  "Whenever this creature attacks, up to one target artifact, creature, or planeswalker an opponent controls loses all abilities until your next turn. If it's a creature, it also has base power and toughness 2/2 until your next turn.";

export default defineCard({
  name: "Azure Beastbinder",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Rat", "Rogue"],
  power: 1,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${EVASION_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      // Checked as blockers are declared only (the ruling): Steel-Leaf
      // Champion's shape.
      affects: { scope: "self" },
      cantBeBlockedBy: { power: { op: "gte", n: 2 } },
      text: EVASION_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "permanent",
            filter: { typesAnyOf: ["artifact", "creature", "planeswalker"], controlledBy: "opponent" },
          },
        },
      ],
      // A creature: one timestamped layer-6 loss plus a layer-7b base P/T of
      // 2/2 (Turn to Frog's `animate`, adding no types), so a later grant or
      // P/T-setting effect still applies over it (the rulings). Anything else
      // only loses its abilities.
      effect: {
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { type: "creature" } },
        then: {
          kind: "animate",
          target: 0,
          power: 2,
          toughness: 2,
          addTypes: [],
          addSubtypes: [],
          loseAbilities: true,
          duration: "until-your-next-turn",
        },
        else: { kind: "lose-abilities", target: 0, duration: "until-your-next-turn" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
