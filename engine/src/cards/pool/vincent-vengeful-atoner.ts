import { defineCard } from "../define.js";

// EDHREC rank 4107.
//
// Rulings:
//   [2025-06-06] Vincent's last ability doesn't care what Vincent's power is when it deals combat
//     damage to an opponent; it only matters what its power is when the ability resolves.
//   [2025-06-06] If Vincent isn't on the battlefield when its last ability resolves, use its power
//     as it last existed on the battlefield to determine whether it deals damage to each other
//     opponent.
//   [2025-06-06] The damage dealt by Vincent as a result of its last ability is not combat damage
//     and therefore doesn't cause the ability to trigger again.
// The power check is a `source` condition read as the ability resolves — as
// Vincent last existed if he has left (rule 603.10a). Hydra Omnivore's shape.

const COUNTER_TEXT =
  "Whenever one or more creatures you control deal combat damage to a player, put a +1/+1 counter on Vincent.";
const CHAOS_TEXT =
  "Chaos — Whenever Vincent deals combat damage to an opponent, it deals that much damage to each other opponent if Vincent's power is 7 or greater.";

export default defineCard({
  name: "Vincent, Vengeful Atoner",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Assassin"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${COUNTER_TEXT}\n${CHAOS_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature" },
        combat: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self", toOpponent: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source", filter: { power: { op: "gte", n: 7 } } },
        then: { kind: "damage", amount: { triggerValue: true }, who: "each-other-opponent" },
      },
      resolve: null,
      text: CHAOS_TEXT,
    },
  ],
});
