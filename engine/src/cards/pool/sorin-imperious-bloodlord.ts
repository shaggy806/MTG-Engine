import { defineCard } from "../define.js";

// EDHREC rank 4000.
//
// Rulings:
//   [2025-01-24] If the target of the reflexive triggered ability is an illegal target as that
//     ability tries to resolve, it doesn’t resolve. You won’t gain 3 life.
//   [2025-01-24] You don’t choose a target for Sorin’s second ability at the time you activate it.
//     Rather, a second “reflexive” ability triggers when you sacrifice a Vampire this way. You
//     choose a target for this ability as it goes on the stack. Each player may respond to this
//     triggered ability as normal.
//   [2025-01-24] Multiple instances of deathtouch and/or lifelink on the same creature are
//     redundant.

// - "+1: You may sacrifice a Vampire. When you do, …" — an `each-player-may`
//   of you alone (Caesar, Legion's Emperor's shape) whose `ifDid` is a
//   reflexive trigger (rule 603.12): its target is chosen as it triggers, and
//   with that target illegal it does nothing at all, the life gain included.
// - "If it's a Vampire" is checked on resolution (Blacksmith's Skill's
//   `conditional` over the target).
// - "−3: You may put a Vampire creature card from your hand onto the
//   battlefield" — Elvish Piper's `look-and-choose` of the hand.
const PUMP_TEXT =
  "+1: Target creature you control gains deathtouch and lifelink until end of turn. If it's a Vampire, put a +1/+1 counter on it.";
const SAC_TEXT = "+1: You may sacrifice a Vampire. When you do, Sorin deals 3 damage to any target and you gain 3 life.";
const PUT_TEXT = "−3: You may put a Vampire creature card from your hand onto the battlefield.";

export default defineCard({
  name: "Sorin, Imperious Bloodlord",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Sorin"],
  loyalty: 4,
  text: `${PUMP_TEXT}\n${SAC_TEXT}\n${PUT_TEXT}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { subtype: "Vampire" } },
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { subtype: "Vampire" }, text: "Sacrifice a Vampire" }],
        ifDid: {
          kind: "reflexive-trigger",
          targets: ["any-target"],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "damage", amount: 3, target: 0 },
              { kind: "gain-life", amount: 3 },
            ],
          },
          text: "When you do, Sorin deals 3 damage to any target and you gain 3 life.",
        },
      },
      resolve: null,
      text: SAC_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", subtype: "Vampire" },
      },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
