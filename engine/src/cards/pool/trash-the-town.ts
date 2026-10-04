import { defineCard } from "../define.js";

// EDHREC rank 6035.
//
// Rulings:
//   [2024-04-12] No player can cast spells or activate abilities in between the modes of a
//     resolving spell. Any abilities that trigger won’t be put onto the stack until the spell is
//     done resolving.
//   [2024-04-12] If a mode requires a target, you can select that mode only if there’s a legal
//     target available. Ignore the targeting requirements for modes you don’t choose.
//   [2024-04-12] You can’t choose the same mode more than once.
//   [2024-04-12] If all targets for the chosen modes become illegal before a spell with spree
//     resolves, the spell won’t resolve and none of its effects will happen. If at least one
//     target is still legal, the spell will resolve but will have no effect on any illegal
//     targets.
//   [2024-04-12] No matter which modes you choose, you always follow the instructions in the order
//     they are written.
//   [2024-04-12] You choose the modes as you cast the spell with spree. Once modes are chosen,
//     they can’t be changed.
//   [2024-04-12] The mana value of a spell with spree is determined only by its mana cost (in the
//     upper right corner of the card). It doesn’t matter which modes you choose or which
//     additional costs you pay, including any additional costs imposed by other effects.
//   [2024-04-12] Each additional cost and associated mode in the text box is also preceded with a
//     + indicator. These symbols also have no rules meaning and serve only to remind players that
//     the listed costs are additional costs.
//   [2024-04-12] You must choose at least one of the listed modes and pay its associated
//     additional cost in order to cast a spell with spree.
//   [2024-04-12] Spells with spree have a + (plus sign) indicator in the upper right corner of the
//     card frame. This has no rules meaning and serves only to remind players that at least one
//     additional cost is required to cast the spell.
//   [2024-04-12] If an effect allows you to cast a spell with spree “without paying its mana
//     cost,” you must still choose at least one mode and pay the associated additional costs.
//   [2024-04-12] If a spell with spree is copied, the effect that creates the copy may allow you
//     to choose new targets. You cannot choose new modes.

const COUNTERS_MODE = "+ {2} — Put two +1/+1 counters on target creature.";
const TRAMPLE_MODE = "+ {1} — Target creature gains trample until end of turn.";
const DRAW_MODE =
  '+ {1} — Until end of turn, target creature gains "Whenever this creature deals combat damage to a player, draw two cards."';

export default defineCard({
  name: "Trash the Town",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: `Spree (Choose one or more additional costs.)\n${COUNTERS_MODE}\n${TRAMPLE_MODE}\n${DRAW_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: COUNTERS_MODE,
        spreeCost: "{2}",
        targets: ["creature"],
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      },
      {
        text: TRAMPLE_MODE,
        spreeCost: "{1}",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      },
      {
        text: DRAW_MODE,
        spreeCost: "{1}",
        targets: ["creature"],
        effect: {
          kind: "grant-triggered",
          target: 0,
          duration: "end-of-turn",
          ability: {
            trigger: { on: "deals-combat-damage-to-player", who: "self" },
            targets: [],
            effect: { kind: "draw", amount: 2 },
            resolve: null,
            text: "Whenever this creature deals combat damage to a player, draw two cards.",
          },
        },
      },
    ],
  },
});
