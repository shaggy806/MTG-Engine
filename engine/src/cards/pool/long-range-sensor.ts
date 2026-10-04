import { defineCard } from "../define.js";

// EDHREC rank 5082.
//
// Rulings:
//   [2025-07-25] If you can't cast the discovered card (perhaps because there are no legal targets
//     for the spell), you'll put it into your hand.
//   [2025-07-25] Long-Range Sensor's first ability will trigger once for each player you attack.
//   [2025-07-25] You exile the cards face up. All players will be able to see them.
//   [2025-07-25] When you discover, you must exile cards. The only optional part of the ability is
//     whether you cast the exiled card or put it into your hand.
//   [2025-07-25] If the discovered card has {X} in its mana cost, you must choose 0 as the value
//     of X when casting it without paying its mana cost.
//
// "Whenever you attack a player" fires once per player attacked (Horizon
// Explorer's `attacks-player`). Discover 4 (rule 701.57a) is Hidden
// Nursery's shape.
const ATTACK_TEXT = "Whenever you attack a player, put a charge counter on this artifact.";
const DISCOVER_TEXT =
  "{1}, Remove two charge counters from this artifact: Discover 4. Activate only as a sorcery. (Exile cards from the top of your library until you exile a nonland card with mana value 4 or less. Cast it without paying its mana cost or put it into your hand. Put the rest on the bottom in a random order.)";

export default defineCard({
  name: "Long-Range Sensor",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: `${ATTACK_TEXT}\n${DISCOVER_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks-player", who: "you", defender: "any" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, removeCounter: { kind: "charge", count: 2 } },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { notTypes: ["land"], manaValue: { op: "lte", n: 4 } },
        exile: true,
        keepFound: true,
        rest: "bottom-random",
        then: {
          kind: "cast-now",
          target: 0,
          free: true,
          spell: { manaValue: { op: "lte", n: 4 } },
          else: { kind: "return-to-hand", target: 0, from: "exile" },
        },
      },
      resolve: null,
      text: DISCOVER_TEXT,
      sorcerySpeed: true,
    },
  ],
});
