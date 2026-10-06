import { defineCard } from "../define.js";

// EDHREC rank 6434.
//
// Rulings:
//   [2020-01-24] You can activate Dream Trawler's last ability even if it's already tapped. It
//     still gains hexproof until end of turn.
//   [2020-01-24] Dream Trawler's second triggered ability resolves before blockers are declared.
//     This normally causes its first triggered ability to trigger, which also resolves before
//     blockers are declared.
const PUMP_TEXT = "Whenever you draw a card, this creature gets +1/+0 until end of turn.";
const ATTACK_TEXT = "Whenever this creature attacks, draw a card.";
const HEXPROOF_TEXT = "Discard a card: This creature gains hexproof until end of turn. Tap it.";

export default defineCard({
  name: "Dream Trawler",
  manaCost: "{2}{W}{W}{U}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 3,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${PUMP_TEXT}\n${ATTACK_TEXT}\n${HEXPROOF_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      // No {T} in the cost: it can be activated while tapped (the ruling).
      cost: { mana: null, tap: false, discard: { count: 1 } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "hexproof", duration: "end-of-turn" },
          { kind: "tap", target: "source" },
        ],
      },
      resolve: null,
      text: HEXPROOF_TEXT,
    },
  ],
});
