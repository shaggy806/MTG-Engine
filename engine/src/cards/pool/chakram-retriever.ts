import { defineCard } from "../define.js";

// EDHREC rank 6066.
//
// Rulings:
//   [2018-06-08] A nonlegendary creature can't be your commander, even if it has a "partner with"
//     ability.
//   [2018-06-08] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2018-06-08] Chakram Retriever's last ability resolves before the spell that caused it to
//     trigger.

const UNTAP_TEXT = "Whenever you cast a spell during your turn, untap target creature.";

export default defineCard({
  name: "Chakram Retriever",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 2,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Chakram Slinger" },
  text: `Partner with Chakram Slinger (When this creature enters, target player may put Chakram Slinger into their hand from their library, then shuffle.)\n${UNTAP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Chakram Slinger" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Chakram Slinger, reveal it, put it into their hand, then shuffle.",
    },
    {
      trigger: { on: "cast-spell", who: "you" },
      // "During your turn" — a turn can't end with the trigger on the stack,
      // so checking it again as it resolves changes nothing.
      condition: { kind: "your-turn" },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
