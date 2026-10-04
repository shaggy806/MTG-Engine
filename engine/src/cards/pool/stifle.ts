import { defineCard } from "../define.js";

// EDHREC rank 4568.
//
// Rulings:
//   [2004-10-04] It can target delayed triggered abilities. For example, a card that says
//     "Whenever a player cycles a card, you may exile target creature. If you do, return that
//     creature to the battlefield at the beginning of the end step." triggers when a player cycles
//     a card and creates a delayed trigger that happens at the beginning of the end step. You can
//     choose to target the "at the beginning of the end step" trigger when it is placed on the
//     stack at end of turn.
//   [2004-10-04] An activated ability has a "Cost: Effect" format. Look for the colon. A triggered
//     ability starts with "when", "whenever", or "at".
//   [2004-10-04] Turn-based actions and special actions like the normal card draw, combat damage,
//     or turning a face-down creature face up can't be targeted.

export default defineCard({
  name: "Stifle",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target activated or triggered ability. (Mana abilities can't be targeted.)",
  targets: ["activated-or-triggered-ability"],
  effect: { kind: "counter", target: 0 },
});
