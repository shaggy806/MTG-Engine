import { defineCard } from "../define.js";

// EDHREC rank 6462.
//
// Wizardcycling is Step Through's `cycling.search`.
const ENTER_TEXT = "When this creature enters, return target Sliver to its owner's hand.";

export default defineCard({
  name: "Vedalken Aethermage",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 1,
  toughness: 2,
  keywords: ["flash"],
  text:
    `Flash (You may cast this spell any time you could cast an instant.)\n${ENTER_TEXT}\n` +
    "Wizardcycling {3} ({3}, Discard this card: Search your library for a Wizard card, reveal it, put it into your hand, then shuffle.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", filter: { subtype: "Sliver" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  cycling: { cost: "{3}", search: { subtype: "Wizard" } },
});
