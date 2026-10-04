import { defineCard } from "../define.js";

// EDHREC rank 5276.
//
// Rulings:
//   [2018-07-13] If the chosen creature is copying something else (for example, if the chosen
//     creature is another Mirror Image), then Mirror Image enters the battlefield as whatever the
//     chosen creature copied.
//   [2018-07-13] Any enters-the-battlefield abilities of the copied creature will trigger when
//     Mirror Image enters the battlefield. Any "as [this creature] enters the battlefield" or
//     "[this creature] enters the battlefield with" abilities of the chosen creature will also
//     work.
//   [2018-07-13] If Mirror Image somehow enters the battlefield at the same time as another
//     creature, it can't become a copy of that creature. You may choose only a creature that's
//     already on the battlefield.
//   [2018-07-13] Mirror Image copies exactly what was printed on the original creature (unless
//     that creature is copying something else or is a token; see below). It doesn't copy whether
//     that creature is tapped or untapped, whether it has any counters on it or any Auras and
//     Equipment attached to it, or any non-copy effects that have changed its power, toughness,
//     types, color, or so on.
//   [2018-07-13] If the copied creature has {X} in its mana cost, X is considered to be 0.
//   [2018-07-13] If the chosen creature is a token, Mirror Image copies the original
//     characteristics of that token as stated by the effect that put the token onto the
//     battlefield. Mirror Image doesn't become a token in this case.

export default defineCard({
  name: "Mirror Image",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  text: "You may have this creature enter as a copy of a creature you control.",
  copyOnEnter: { filter: { type: "creature", controlledBy: "you" } },
});
