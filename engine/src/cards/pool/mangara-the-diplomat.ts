import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever an opponent attacks with creatures, if two or more of those creatures are attacking you and/or planeswalkers you control, draw a card.";
const SPELL_TEXT = "Whenever an opponent casts their second spell each turn, draw a card.";

// The attack count is an intervening if, asked again as it resolves: a
// creature removed from combat since no longer counts, one that left the
// battlefield counts by what it was attacking (the rulings). One card however
// many attack.
export default defineCard({
  name: "Mangara, the Diplomat",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 4,
  keywords: ["lifelink"],
  text: `Lifelink\n${ATTACK_TEXT}\n${SPELL_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "opponent", atLeast: 2, attackingYou: true, stillAttacking: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "opponent", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: SPELL_TEXT,
    },
  ],
});
