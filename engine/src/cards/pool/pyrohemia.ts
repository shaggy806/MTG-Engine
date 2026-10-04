import { defineCard } from "../define.js";

// EDHREC rank 2455.
//
// Rulings:
//   [2004-10-04] Each activation is considered a new damage effect. An activation can only be 1
//     point of damage.
//   [2011-06-01] Note that "until end of turn" effects wear off after "at the beginning of the end
//     step" triggered abilities, so an artifact that animates until end of turn can keep this on
//     the battlefield.
//   [2011-06-01] It will stay on the battlefield if there is a creature that is put into the
//     graveyard during the end step. This is because this ability will not trigger at all if there
//     is at least one creature on the battlefield as the end step begins.
//
// "No creatures are on the battlefield" is neither you nor any opponent
// controlling one — an intervening-if, checked as the step begins and again
// as it resolves. The damage to creatures and to players is one instruction,
// so one simultaneous event (`simultaneous`).
const SAC_TEXT = "At the beginning of the end step, if no creatures are on the battlefield, sacrifice this enchantment.";
const DAMAGE_TEXT = "{R}: This enchantment deals 1 damage to each creature and each player.";

export default defineCard({
  name: "Pyrohemia",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${SAC_TEXT}\n${DAMAGE_TEXT}`,
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "damage-all", filter: { type: "creature" }, amount: 1 },
          { kind: "damage", amount: 1, who: "each-player" },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "controls", filter: { type: "creature" }, atLeast: 1 } },
          { kind: "not", of: { kind: "opponent-controls", filter: { type: "creature" }, atLeast: 1 } },
        ],
      },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
