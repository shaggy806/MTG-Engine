import { defineCard } from "../define.js";

// EDHREC rank 4937.
//
// Rulings:
//   [2023-04-14] If you don’t play the card, it will remain exiled.
//   [2023-04-14] Playing the card exiled with Hedron Detonator follows the normal rules for
//     playing that card. You must pay its costs, and you must follow all applicable timing rules.
//   [2023-04-14] You may play the card exiled with Hedron Detonator even if Hedron Detonator
//     leaves the battlefield or you lose control of it.
//
// The sacrifice is Sai, Master Thopterist's two-artifact cost; the exile is
// Zuko's `impulse-exile` for this turn.
const DAMAGE_TEXT = "Whenever an artifact you control enters, this creature deals 1 damage to target opponent.";
const EXILE_TEXT =
  "{T}, Sacrifice two artifacts: Exile the top card of your library. You may play that card this turn.";

export default defineCard({
  name: "Hedron Detonator",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Artificer"],
  power: 2,
  toughness: 3,
  text: `${DAMAGE_TEXT}\n${EXILE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" }, count: 2 } },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
