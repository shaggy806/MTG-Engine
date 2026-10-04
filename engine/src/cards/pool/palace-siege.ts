import { defineCard } from "../define.js";

// EDHREC rank 5855.
//
// Outpost Siege's shape: each ability is gated on the anchor word named as
// this entered (a copy makes its own choice — the first ruling).
//
// Rulings:
//   [2014-11-24] Each of the last two abilities is linked to the first ability. They each refer
//     only to the choice made as a result of the first ability. If a permanent enters the
//     battlefield as a copy of one of the Sieges, its controller will make a new choice for that
//     Siege. Which ability the copy has won't depend on the choice made for the original
//     permanent.
//   [2014-11-24] Each Siege will have one of the two listed abilities, depending on your choice as
//     it enters the battlefield.

const KHANS_TEXT =
  "Khans — At the beginning of your upkeep, return target creature card from your graveyard to your hand.";
const DRAGONS_TEXT = "Dragons — At the beginning of your upkeep, each opponent loses 2 life and you gain 2 life.";

export default defineCard({
  name: "Palace Siege",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Khans or Dragons.\n• ${KHANS_TEXT}\n• ${DRAGONS_TEXT}`,
  chooseOnEnter: ["Khans", "Dragons"],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Khans" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: KHANS_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Dragons" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: DRAGONS_TEXT,
    },
  ],
});
