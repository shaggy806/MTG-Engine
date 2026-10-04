import { defineCard } from "../define.js";

// EDHREC rank 5957.
//
// Rulings:
//   [2019-06-14] You can sacrifice any Goblin you control to activate Sling-Gang Lieutenant’s
//     activated ability, not just the ones its triggered ability creates. You can even sacrifice
//     Sling-Gang Lieutenant itself.

const DRAIN_TEXT = "Sacrifice a Goblin: Target player loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Sling-Gang Lieutenant",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: `When this creature enters, create two 1/1 red Goblin creature tokens.\n${DRAIN_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["player"],
      // Falkenrath Noble's drain.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 2 },
      resolve: null,
      text: "When this creature enters, create two 1/1 red Goblin creature tokens.",
    },
  ],
});
