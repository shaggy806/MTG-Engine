import { defineCard } from "../define.js";

const BY_TOUGHNESS_TEXT =
  "During your turn, each creature assigns combat damage equal to its toughness rather than its power.";
const ATTACK_TEXT =
  "Whenever Baldin attacks, up to one hundred target creatures each get +0/+X until end of turn, " +
  "where X is the number of cards in your hand.";

// Doran, the Siege Tower's static, but only during its controller's turn —
// "each creature", an opponent's blockers included. "Up to one hundred
// target creatures" is an any-number group capped at 100; X is counted as
// the trigger resolves, once for every target.
export default defineCard({
  name: "Baldin, Century Herdmaster",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 0,
  toughness: 7,
  text: `${BY_TOUGHNESS_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "all-creatures" },
      condition: { kind: "your-turn" },
      combatDamageByToughness: "always",
      text: BY_TOUGHNESS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "any-number", of: "creature", max: 100 }],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: {
          kind: "modify-pt",
          target: 0,
          power: 0,
          toughness: { cardsInHand: "you" },
          duration: "end-of-turn",
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
