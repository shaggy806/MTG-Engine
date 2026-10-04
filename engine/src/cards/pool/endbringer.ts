import { defineCard } from "../define.js";

// EDHREC rank 2405.
//
// Rulings:
//   [2016-01-22] Activating the second activated ability after a creature has legally been
//     declared as an attacker or blocker won't change or undo that attack or block.
//   [2016-01-22] Endbringer untaps at the same time as the active player's permanents. You can't
//     choose to not untap it at that time.
//   [2016-01-22] If an effect states that Endbringer doesn't untap during your untap step, that
//     effect won't apply during another player's untap step.

const UNTAP_TEXT = "Untap this creature during each other player's untap step.";

export default defineCard({
  name: "Endbringer",
  manaCost: "{5}{C}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 5,
  toughness: 5,
  text: `${UNTAP_TEXT}\n{T}: This creature deals 1 damage to any target.\n{C}, {T}: Target creature can't attack or block this turn.\n{C}{C}, {T}: Draw a card.`,
  static: [{ affects: { scope: "self" }, untapsDuringOthersUntap: "self", text: UNTAP_TEXT }],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to any target.",
    },
    {
      cost: { mana: "{C}", tap: true },
      targets: ["creature"],
      effect: { kind: "restrict", target: 0, restrictions: ["cant-attack", "cant-block"] },
      resolve: null,
      text: "{C}, {T}: Target creature can't attack or block this turn.",
    },
    {
      cost: { mana: "{C}{C}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{C}{C}, {T}: Draw a card.",
    },
  ],
});
