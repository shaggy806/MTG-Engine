import { defineCard } from "../define.js";

// EDHREC rank 4974.
//
// Rulings:
//   [2024-04-12] Use the mana value of the sacrificed creature as it last existed on the
//     battlefield to determine how many cards to exile.
//   [2024-04-12] If the sacrificed creature had {X} in its mana cost, X is 0 for the purpose of
//     determining its mana value.
//   [2024-04-12] You pay all costs and follow all normal timing rules for cards played from exile
//     with Rakdos's triggered ability. For example, if the exiled card is a land card, you may
//     play it only during your main phase while the stack is empty.
//
// The sacrificed creature is the trigger object, read as it last existed
// (`manaValueOf` falls back to its last-known information). "You may play"
// covers lands, so no `castOnly`; `spendAs: "any-type"` is Gonti's rider.

const SAC_TRIGGER_TEXT =
  "Whenever you sacrifice another creature, exile cards equal to its mana value from the top of target player's library. Until your next end step, you may play those cards, and mana of any type can be spent to cast those spells.";
const SAC_ABILITY_TEXT =
  "Sacrifice another creature: Rakdos gains indestructible until end of turn. Tap it. Activate only once each turn.";

export default defineCard({
  name: "Rakdos, the Muscle",
  manaCost: "{2}{B}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Mercenary"],
  power: 6,
  toughness: 5,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${SAC_TRIGGER_TEXT}\n${SAC_ABILITY_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      oncePerTurn: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" },
          { kind: "tap", target: "source" },
        ],
      },
      resolve: null,
      text: SAC_ABILITY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature" }, otherOnly: true },
      targets: ["player"],
      effect: {
        kind: "impulse-exile",
        amount: { manaValueOf: "trigger-object" },
        whose: 0,
        duration: "your-next-end-step",
        spendAs: "any-type",
      },
      resolve: null,
      text: SAC_TRIGGER_TEXT,
    },
  ],
});
