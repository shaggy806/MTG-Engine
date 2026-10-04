import { defineCard } from "../define.js";

// EDHREC rank 5835.
//
// Rulings:
//   [2024-11-08] Chandra's first ability is not a mana ability. It uses the stack and players can
//     respond to it.
//   [2024-11-08] You choose the targets and how damage will be divided as you activate Chandra's
//     last ability. Each chosen target must receive at least 1 damage.
//   [2024-11-08] If some of the targets of Chandra's last ability become illegal, the original
//     division of damage still applies, but the damage that would have been dealt to illegal
//     targets isn't dealt at all.
//   [2024-11-08] You pay all costs and follow all timing rules for cards played with the
//     permission granted by Chandra's first ability.
//   (and the copy rulings: the token copies the copiable values, with the listed exceptions)
//
// +2 is a loyalty ability, so it uses the stack (rule 606.3 — `isManaAbility`
// excludes it). Its impulse is Tectonic Giant's `choose: 1`: the other two
// stay exiled with no permission. +1 is Electroduplicate's copy with the
// exceptions as copiable values. −4 divides as it's activated (Skarrgan
// Hellkite; Dragonlord Atarka's target group).

const PLUS_TWO_TEXT =
  "+2: Add {R}{R}{R}. Exile the top three cards of your library. Choose one. You may play that card this turn.";
const SACRIFICE_TEXT = "At the beginning of the end step, sacrifice this token.";
const PLUS_ONE_TEXT = `+1: Create a token that's a copy of target creature you control, except it has haste and "${SACRIFICE_TEXT}"`;
const MINUS_FOUR_TEXT =
  "−4: Chandra deals 8 damage divided as you choose among any number of target creatures and/or planeswalkers.";

export default defineCard({
  name: "Chandra, Flameshaper",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Chandra"],
  loyalty: 6,
  text: `${PLUS_TWO_TEXT}\n${PLUS_ONE_TEXT}\n${MINUS_FOUR_TEXT}`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-mana", mana: "R", amount: 3 },
          { kind: "impulse-exile", amount: 3, duration: "end-of-turn", choose: 1 },
        ],
      },
      resolve: null,
      text: PLUS_TWO_TEXT,
    },
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["creature-you-control"],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        exceptions: {
          keywords: ["haste"],
          triggered: [
            {
              trigger: { on: "step-begins", step: "end", who: "any" },
              targets: [],
              effect: { kind: "sacrifice-source" },
              resolve: null,
              text: SACRIFICE_TEXT,
            },
          ],
        },
      },
      resolve: null,
      text: PLUS_ONE_TEXT,
    },
    {
      loyaltyCost: -4,
      cost: { mana: null, tap: false },
      targets: [
        {
          kind: "any-number",
          of: { kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } },
          max: 8,
        },
      ],
      divided: { total: 8, slot: 0 },
      effect: { kind: "damage-divided", from: 0 },
      resolve: null,
      text: MINUS_FOUR_TEXT,
    },
  ],
});
