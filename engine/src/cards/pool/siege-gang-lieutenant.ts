import { defineCard } from "../define.js";

// EDHREC rank 2579.
//
// Rulings:
//   [2024-06-07] If you don't control your commander as the lieutenant ability resolves, you won't
//     get its effect.
//   [2024-06-07] If you have multiple commanders, the lieutenant effect will happen as long as you
//     control at least one commander. It will happen only once even if you control multiple
//     commanders.

const LIEUTENANT_TEXT =
  "Lieutenant — At the beginning of combat on your turn, if you control your commander, create two 1/1 red Goblin creature tokens. Those tokens gain haste until end of turn.";
const SAC_TEXT = "{2}, Sacrifice a Goblin: This creature deals 1 damage to any target.";

export default defineCard({
  name: "Siege-Gang Lieutenant",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  text: `${LIEUTENANT_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      // "Your commander" is one you own (rule 903.3) — Ironwill Forger's gate.
      condition: { kind: "controls", filter: { isCommander: true, ownedBy: "you" }, atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 2, gainUntilEndOfTurn: ["haste"] },
      resolve: null,
      text: LIEUTENANT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
