import { defineCard } from "../define.js";

// EDHREC rank 4239.
//
// Rulings:
//   [2023-06-16] To amass Orcs N, if you don't control an Army creature, create a 0/0 black Orc
//     Army creature token. Then you choose an Army creature you control and put N +1/+1 counters
//     on it. If that Army isn't already an Orc, it becomes an Orc in addition to its other types.

const AMASS_TEXT =
  "When Gothmog enters, amass Orcs 1. (Put a +1/+1 counter on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)";
const TOKENS_TEXT = "Creature tokens you control have deathtouch.";

export default defineCard({
  name: "Gothmog, Morgul Lieutenant",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: AMASS_TEXT + "\n" + TOKENS_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 1, creatureType: "Orc" },
      resolve: null,
      text: AMASS_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", tokenOnly: true },
      grantKeywords: ["deathtouch"],
      text: TOKENS_TEXT,
    },
  ],
});
