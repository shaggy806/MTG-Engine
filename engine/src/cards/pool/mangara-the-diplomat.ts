import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever an opponent attacks with creatures, if two or more of those creatures are attacking you and/or planeswalkers you control, draw a card.";
const SPELL_TEXT = "Whenever an opponent casts their second spell each turn, draw a card.";

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
      // One card per declaration, however many attack you beyond the second
      // (ruling) — `attack-with`, counting only attackers aimed at you or a
      // planeswalker you control.
      trigger: { on: "attack-with", who: "opponent", atLeast: 2, attackingYou: true },
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
