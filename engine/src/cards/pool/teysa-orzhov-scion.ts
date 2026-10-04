import { defineCard } from "../define.js";

// EDHREC rank 4363.
// Makes Spirit → use "Spirit Token".
//
// Rulings:
//   [2024-01-12] You may sacrifice Teysa itself to help pay for its first ability, but Teysa dying
//     won't cause its second ability to trigger. Any other white and black creatures you sacrifice
//     to pay for the first ability will cause the second ability to trigger.

const EXILE_TEXT = "Sacrifice three white creatures: Exile target creature.";
const SPIRIT_TEXT = "Whenever another black creature you control dies, create a 1/1 white Spirit creature token with flying.";

export default defineCard({
  name: "Teysa, Orzhov Scion",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 3,
  text: `${EXILE_TEXT}\n${SPIRIT_TEXT}`,
  activated: [
    {
      // Teysa herself may be one of the three (the ruling). The three leave as
      // one event, so the other black ones' deaths trigger the second ability.
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "creature", colors: ["W"] }, count: 3 } },
      targets: ["creature"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", colors: ["B"] }, otherOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: SPIRIT_TEXT,
    },
  ],
});
