import { defineCard } from "../define.js";

// EDHREC rank 6244.
//
// Rulings:
//   [2025-10-02] The experience counter goes on you, the player, not on Katara. You will keep that
//     counter even if Katara, Waterbending Master dies.
//   [2025-10-02] All experience counters are identical, no matter how you got them. For example,
//     Katara's last ability will count experience counters that you got from the first ability,
//     from another ability, from another copy of Katara, Waterbending Master, and so on.

const XP_TEXT = "Whenever you cast a spell during an opponent's turn, you get an experience counter.";
const ATTACK_TEXT =
  "Whenever Katara attacks, you may draw a card for each experience counter you have. If you do, discard a card.";

// "During an opponent's turn" is Alela's `not your-turn`. The draw is
// Sanctum of Calm Waters' shape: X read as it resolves, the discard rides on
// the "yes".
export default defineCard({
  name: "Katara, Waterbending Master",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 1,
  toughness: 3,
  text: `${XP_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      condition: { kind: "not", of: { kind: "your-turn" } },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: XP_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card for each experience counter you have, then discard a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: { playerCounters: "experience" } },
            { kind: "discard", target: "you", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
