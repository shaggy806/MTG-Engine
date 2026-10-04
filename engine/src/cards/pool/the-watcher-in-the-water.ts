import { defineCard } from "../define.js";

// EDHREC rank 5646.
//
// Rulings:
//   [2023-06-16] For the last ability, the target Kraken can (and probably will) be The Watcher in
//     the Water. If it is, and if it has at least one stun counter on it, you'll remove a stun
//     counter from it instead of untapping it.
//
// Stun counters (rule 122.1d) are Baloth Prime's: untapping it removes one
// instead. "During an opponent's turn" is any turn that isn't yours — every
// other player is an opponent. The untap comes before the stun counter, as
// printed, so a Watcher that is both targets loses one and gains one.
const ENTER_TEXT =
  "The Watcher in the Water enters tapped with nine stun counters on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)";
const DRAW_TEXT = "Whenever you draw a card during an opponent's turn, create a 1/1 blue Tentacle creature token.";
const DIES_TEXT =
  "Whenever a Tentacle you control dies, untap up to one target Kraken and put a stun counter on up to one target nonland permanent.";

export default defineCard({
  name: "The Watcher in the Water",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 9,
  toughness: 9,
  text: `${ENTER_TEXT}\n${DRAW_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true, counters: { kind: "stun", amount: 9 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      condition: { kind: "not", of: { kind: "your-turn" } },
      targets: [],
      effect: { kind: "create-token", token: "Tentacle Token", count: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Tentacle" } },
      targets: [
        { kind: "optional", of: { kind: "permanent", filter: { subtype: "Kraken" } } },
        { kind: "optional", of: "nonland-permanent" },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          { kind: "add-counter", target: 1, counter: "stun", amount: 1 },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
