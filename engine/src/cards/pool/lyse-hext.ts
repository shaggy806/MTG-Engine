import { defineCard } from "../define.js";

// EDHREC rank 3460.
//
// Rulings:
//   [2025-06-06] Noncreature spells that were cast before Lyse Hext entered count. For example, if
//     Lyse Hext enters on a turn where you've already cast two noncreature spells, she'll have
//     double strike immediately.
//   [2025-06-06] The cost reduction applies only to generic mana in the total cost of noncreature
//     spells you cast.

const PROWESS = "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)";
const COST_TEXT = "Noncreature spells you cast cost {1} less to cast.";
const DOUBLE_STRIKE_TEXT = "As long as you've cast two or more noncreature spells this turn, Lyse Hext has double strike.";

export default defineCard({
  name: "Lyse Hext",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Monk"],
  power: 2,
  toughness: 2,
  text: `${PROWESS}\n${COST_TEXT}\n${DOUBLE_STRIKE_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PROWESS,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { notTypes: ["creature"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      // Each spell read as it was cast (`spellsCastThisTurnAs`), so the ones
      // cast before Lyse entered count too (the ruling).
      affects: { scope: "self" },
      condition: { kind: "cast-this-turn", filter: { notTypes: ["creature"] }, atLeast: 2 },
      grantKeywords: ["double-strike"],
      text: DOUBLE_STRIKE_TEXT,
    },
  ],
});
