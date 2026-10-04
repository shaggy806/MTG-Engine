import { defineCard } from "../define.js";

// EDHREC rank 5382.
//
// Rulings:
//   [2022-09-09] You may not play lands exiled with the last ability.
//   [2022-09-09] You must pay all costs and follow all normal timing rules for spells cast with
//     Ramirez DePietro, Pillager's last ability.
// Once per player dealt damage; "that player" is the trigger player (Rev,
// Tithe Extractor's shape, face up here).

const ENTER_TEXT = "When Ramirez DePietro enters, you lose 2 life and create two Treasure tokens.";
const DAMAGE_TEXT =
  "Whenever one or more Pirates you control deal combat damage to a player, exile the top card of that player's library. You may cast that card for as long as it remains exiled.";

export default defineCard({
  name: "Ramirez DePietro, Pillager",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 4,
  toughness: 3,
  text: `${ENTER_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2 },
          { kind: "create-token", token: "Treasure Token", count: 2 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Pirate" },
        combat: true,
      },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        whose: "trigger-player",
        duration: "while-exiled",
        castOnly: true,
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
