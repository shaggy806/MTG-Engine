import { defineCard } from "../define.js";

// EDHREC rank 3208.
//
// Rulings:
//   [2025-09-19] Except for not being legendary, the token copies exactly what was printed on the
//     original creature and nothing else (unless that permanent is itself copying something else;
//     see below). It doesn't copy whether that permanent is tapped or untapped, whether it has any
//     counters on it or Auras attached to it, or any non-copy effects that have changed its power,
//     toughness, types, color, and so on.
//   [2025-09-19] If something becomes a copy of the token, the copy also isn't legendary.
//   [2025-09-19] If the copied creature has {X} in its mana cost, X is 0.
//   [2025-09-19] If the copied creature is copying something else, then the token enters as
//     whatever that creature copied, with the listed exceptions.
//   [2025-09-19] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     token enters the battlefield. Any "as [this creature] enters" or "[this creature] enters
//     with" abilities of the creature will also work.
//
// A copy of the trigger object — its copiable values only, read as it last
// existed if it has left the battlefield (rule 608.2h). `notLegendary` is a
// copy exception, so a copy of the token isn't legendary either. You create
// it, so it's yours (`who: "you"`).
const TEXT =
  "Whenever a nontoken creature you control deals combat damage to a player, create a token that's a copy of it, except it isn't legendary.";

export default defineCard({
  name: "Impostor Syndrome",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { token: false, type: "creature" },
      },
      targets: [],
      effect: { kind: "create-token-copy", of: "trigger-object", count: 1, notLegendary: true, who: "you" },
      resolve: null,
      text: TEXT,
    },
  ],
});
