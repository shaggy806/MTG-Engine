import { defineCard } from "../define.js";

const MIRRAN = "Mirran — Whenever you cast an artifact spell, create a 1/1 colorless Myr artifact creature token.";
const PHYREXIAN =
  "Phyrexian — At the beginning of your end step, draw a card, then discard a card. Then if there are fifteen or " +
  "more artifact cards in your graveyard, target opponent loses the game.";

// Only the side named as it entered works: each ability is gated on the
// choice. The Phyrexian ability targets an opponent as it goes on the stack,
// whatever the graveyard holds; the count is asked once the loot is done.
export default defineCard({
  name: "Mirrodin Besieged",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Mirran or Phyrexian.\n• ${MIRRAN}\n• ${PHYREXIAN}`,
  chooseOnEnter: ["Mirran", "Phyrexian"],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      condition: { kind: "chosen-on-enter", value: "Mirran" },
      targets: [],
      effect: { kind: "create-token", token: "Myr Token", count: 1 },
      resolve: null,
      text: MIRRAN,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Phyrexian" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "cards-in-graveyard", atLeast: 15, filter: { type: "artifact" } },
            then: { kind: "lose-game", target: 0 },
          },
        ],
      },
      resolve: null,
      text: PHYREXIAN,
    },
  ],
});
