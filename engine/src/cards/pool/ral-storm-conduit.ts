import { defineCard } from "../define.js";

// EDHREC rank 3669.
//
// Rulings:
//   [2019-05-03] Some spells instruct you to "copy target instant or sorcery spell." Because a
//     spell is never a legal target for itself, you can't cast such a spell targeting itself to
//     create a loop that causes Ral's first ability to trigger over and over.
//   [2019-05-03] If the spell that's copied is modal (that is, it says "Choose one —" or the
//     like), the copy created by Ral's last ability will have the same mode or modes. You can't
//     choose different ones.
//   [2019-05-03] If an effect copies a spell multiple times, as Finale of Promise may, Ral's first
//     ability triggers that many times.
//   [2019-05-03] You can't choose to pay any additional costs for the copy created by Ral's last
//     ability. However, effects based on any additional costs that were paid for the original
//     spell are copied as though those same costs were paid for the copy too.
//   [2019-05-03] The copies that Ral's last ability creates are created on the stack, so they're
//     not "cast." Abilities that trigger when a player casts a spell won't trigger.
//   [2019-05-03] If the spell that's copied has damage divided as it was cast, the division can't
//     be changed (although the targets receiving that damage still can). The same is true of
//     spells that distribute counters.
//   [2019-06-14] If an effect copies a card rather than a spell (such as that of God-Eternal
//     Kefnet), this doesn't cause Ral's first ability to trigger. That ability will trigger if you
//     cast the copy, however.

//
// Magecraft-style cast-or-copy trigger (`orCopy` — Archmage Emeritus); the −2
// is Galvanic Iteration's delayed `nextSpell` trigger, which lasts this turn.
const CAST_TEXT =
  "Whenever you cast or copy an instant or sorcery spell, Ral deals 1 damage to target opponent or planeswalker.";
const PLUS_TEXT = "+2: Scry 1.";
const MINUS_TEXT =
  "−2: When you next cast an instant or sorcery spell this turn, copy that spell. You may choose new targets for the copy.";

export default defineCard({
  name: "Ral, Storm Conduit",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Ral"],
  loyalty: 4,
  text: `${CAST_TEXT}\n${PLUS_TEXT}\n${MINUS_TEXT}`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
        effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
        text: "Copy that spell. You may choose new targets for the copy.",
      },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
