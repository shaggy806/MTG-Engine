import { defineCard } from "../define.js";

// EDHREC rank 3730.
//
// Rulings:
//   [2024-03-08] Similarly, the power of the creature attacking you is checked only when
//     MacCready's second ability triggers. Once it triggers, the creature's controller will lose 2
//     life and you'll gain 2 life when the ability resolves, regardless of whether or not its
//     power is still 4 or greater at that time or whether or not it's still on the battlefield.
//   [2024-03-08] The power of your attacking creature is checked only when MacCready's first
//     ability triggers. Once it triggers, the creature will gain skulk until end of turn when the
//     ability resolves, regardless of whether or not its power is still 2 or less at that time.
//
// Both powers are trigger filters, asked only as the attack is declared (the
// rulings). "Attacks you" is you, not a planeswalker you control
// (`attackingYou` + `defender: "player"`); "its controller" is the
// attacker's, read as it last existed if it has left.

const SKULK_TEXT =
  "Whenever a creature you control with power 2 or less attacks, it gains skulk until end of turn. (It can't be blocked by creatures with greater power.)";
const DRAIN_TEXT =
  "Whenever a creature with power 4 or greater attacks you, its controller loses 2 life and you gain 2 life.";

export default defineCard({
  name: "MacCready, Lamplight Mayor",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 3,
  text: `${SKULK_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature", power: { op: "lte", n: 2 } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "skulk", duration: "end-of-turn" },
      resolve: null,
      text: SKULK_TEXT,
    },
    {
      trigger: {
        on: "attacks",
        who: "any",
        attackingYou: true,
        defender: "player",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "trigger-controller" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
