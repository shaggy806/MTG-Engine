import { defineCard } from "../define.js";

const KHANS_TEXT =
  "Khans — At the beginning of your upkeep, exile the top card of your library. Until end of turn, you may play that card.";
const DRAGONS_TEXT = "Dragons — Whenever a creature you control leaves the battlefield, this enchantment deals 1 damage to any target.";

// Frontier Siege's shape: each ability is gated on the anchor word named as
// this entered (a copy makes its own choice — the first ruling). The card
// exiled by "Khans" is played by the normal rules (the rulings).
export default defineCard({
  name: "Outpost Siege",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Khans or Dragons.\n• ${KHANS_TEXT}\n• ${DRAGONS_TEXT}`,
  chooseOnEnter: ["Khans", "Dragons"],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Khans" },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: KHANS_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "you-control", filter: { type: "creature" } },
      condition: { kind: "chosen-on-enter", value: "Dragons" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: DRAGONS_TEXT,
    },
  ],
});
