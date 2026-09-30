import { defineCard } from "../define.js";

// The lands exiled on the way stay exiled ("rest: stay"). The card found is
// cast for free as the trigger resolves (rule 608.2g), only if that spell's
// mana value is 8 or less — judged as the spell it would be, so a modal
// double-faced card's cheap back face still counts — and if it isn't cast,
// for whatever reason, it goes to its owner's hand from exile.
const EXILE_TEXT =
  "When this enchantment enters, exile cards from the top of your library until you exile a nonland card. You may cast it without paying its mana cost if that spell's mana value is 8 or less. If you don't, put that card into your hand.";
const BOUNCE_TEXT = "When a Dragon you control enters, return this enchantment to its owner's hand.";

export default defineCard({
  name: "Breaching Dragonstorm",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${EXILE_TEXT}\n${BOUNCE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { notTypes: ["land"] },
        exile: true,
        rest: "stay",
        then: {
          kind: "cast-now",
          target: 0,
          free: true,
          spell: { manaValue: { op: "lte", n: 8 } },
          else: { kind: "return-to-hand", target: 0, from: "exile" },
        },
      },
      resolve: null,
      text: EXILE_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
});
