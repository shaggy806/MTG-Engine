import { defineCard } from "../define.js";

// #308 in top-commanders.txt.
//
// - "A creature with a mana ability" is the `hasManaAbility` filter clause
//   (rule 605.1): an activated mana ability or a triggered one — the first
//   ruling names both — its own or granted, so a creature Cryptolith Rite
//   gives "{T}: Add one mana of any color" gets the +2/+2 and the untap.
//   Raggadragga has none of its own, but is one of "each creature you
//   control" if it gains one.
// - The attack trigger checks the creature as it attacks; "untap it" then
//   untaps it, whatever it has by the time the trigger resolves.
// - "If at least seven mana was spent to cast it" can't change once the
//   spell is cast, so checking it as the trigger fires is the same as
//   checking it again on resolution (rule 603.4). Mana, not cost: life paid
//   for a Phyrexian pip doesn't count, and a spell cast without paying its
//   mana cost spent none. The target is any creature, tapped or not (the
//   second ruling).
// - Casting Raggadragga itself — eight mana with two commander casts' tax —
//   never triggers it: the ability works only on the battlefield (rule
//   113.6), and the engine scans a spell being cast only for its own
//   "when you cast this" abilities.
const ANTHEM_TEXT = "Each creature you control with a mana ability gets +2/+2.";
const ATTACK_TEXT = "Whenever a creature you control with a mana ability attacks, untap it.";
const CAST_TEXT =
  "Whenever you cast a spell, if at least seven mana was spent to cast it, untap target " +
  "creature. It gets +7/+7 and gains trample until end of turn.";

export default defineCard({
  name: "Raggadragga, Goreguts Boss",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Boar"],
  power: 4,
  toughness: 4,
  text: `${ANTHEM_TEXT}\n${ATTACK_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", hasManaAbility: true },
      },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { hasManaAbility: true } },
      targets: [],
      effect: { kind: "untap", target: "trigger-object" },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { manaSpent: { op: "gte", n: 7 } } },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          { kind: "modify-pt", target: 0, power: 7, toughness: 7, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
