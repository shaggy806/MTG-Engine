import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 6000.
// Suspend's free cast gives the creature haste until it leaves (game.ts,
// `hastyUntilItLeaves`), as the reminder text says.

const WARD_TEXT = "Other creatures you control have ward {2}.";

export default defineCard({
  name: "Star Whale",
  manaCost: "{6}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Alien", "Whale"],
  power: 8,
  toughness: 8,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${WARD_TEXT}\nSuspend 6—{1}{U} (Rather than cast this card from your hand, you may pay {1}{U} and exile it with six time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost. It has haste.)`,
  suspend: { n: 6, cost: "{1}{U}" },
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you" }, excludeSelf: true },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: WARD_TEXT,
    },
  ],
});
