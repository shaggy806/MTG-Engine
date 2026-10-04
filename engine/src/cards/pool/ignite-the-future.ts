import { defineCard } from "../define.js";

// EDHREC rank 3459.
//
// Rulings:
//   [2019-08-23] If a spell has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2019-08-23] If you don't play some or all of the exiled cards, those cards remain in exile.
//   [2019-08-23] If you cast Ignite the Future from a zone other than a graveyard, you must pay
//     the mana cost or an alternative cost for each spell cast this way. If you cast Ignite the
//     Future from a graveyard, you may choose to cast each spell for its mana cost, an alternative
//     cost, or without paying its mana cost.
//   [2019-08-23] Ignite the Future doesn't change when you can play the exiled cards. For example,
//     if you exile a sorcery card, you can cast it only during your main phase when the stack is
//     empty. If you exile a land card, you can play it only during your main phase and only if you
//     have an available land play remaining.
//
// "Until the end of your next turn" is `your-next-turn` (Escape to the Wilds).
// Cast from a graveyard — flashback or any other way — the permission also
// offers a free cast beside the paid one (`free` without `only`).

const TEXT =
  "Exile the top three cards of your library. Until the end of your next turn, you may play those cards. " +
  "If this spell was cast from a graveyard, you may play cards this way without paying their mana costs.";

export default defineCard({
  name: "Ignite the Future",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{7}{R}" },
  text: `${TEXT}\nFlashback {7}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)`,
  effect: {
    kind: "conditional",
    condition: { kind: "source", filter: { castFrom: "graveyard" } },
    then: { kind: "impulse-exile", amount: 3, duration: "your-next-turn", free: {} },
    else: { kind: "impulse-exile", amount: 3, duration: "your-next-turn" },
  },
});
