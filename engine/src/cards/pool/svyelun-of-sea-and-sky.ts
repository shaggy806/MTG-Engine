import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 3822.
//
// Rulings:
//   [2021-06-18] If a player casts a spell that targets multiple permanents their opponent
//     controls with ward, each of those ward abilities will trigger. If that player doesn't pay
//     for all of them, the spell will be countered.
//   [2021-06-18] If you control Svyelun of Sea and Sky with at least 4 damage and two other
//     Merfolk and one of those Merfolk leaves the battlefield (or stops being a Merfolk),
//     Svyelun will be destroyed.
//
// A static's `controls` scan skips its own source, so "two other Merfolk" is
// `atLeast: 2` over Merfolk.

const INDESTRUCTIBLE_TEXT = "Svyelun has indestructible as long as you control at least two other Merfolk.";
const ATTACK_TEXT = "Whenever Svyelun attacks, draw a card.";
const WARD_TEXT = "Other Merfolk you control have ward {1}.";

export default defineCard({
  name: "Svyelun of Sea and Sky",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "God"],
  power: 3,
  toughness: 4,
  text: `${INDESTRUCTIBLE_TEXT}\n${ATTACK_TEXT}\n${WARD_TEXT} (Whenever another Merfolk you control becomes the target of a spell or ability an opponent controls, counter it unless that player pays {1}.)`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "controls", filter: { subtype: "Merfolk" }, atLeast: 2 },
      grantKeywords: ["indestructible"],
      text: INDESTRUCTIBLE_TEXT,
    },
    {
      affects: { scope: "filter", filter: { subtype: "Merfolk", controlledBy: "you" }, excludeSelf: true },
      grantsTriggered: [ward({ mana: "{1}" })],
      text: WARD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
