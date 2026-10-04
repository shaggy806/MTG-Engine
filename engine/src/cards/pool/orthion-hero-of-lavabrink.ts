import { defineCard } from "../define.js";

// EDHREC rank 2378.
//
// Rulings:
//   [2023-04-14] If the copied creature is a token, the token that’s created copies the original
//     characteristics of that token as stated by the effect that created that token.
//   [2023-04-14] The tokens each copy exactly what was printed on the original creature and
//     nothing else (unless that creature is copying something else or is a token; see below). It
//     doesn’t copy whether that creature is tapped or untapped, whether it has any counters on it
//     or Auras and Equipment attached to it, or any non-copy effects that have changed its power,
//     toughness, types, color, and so on.
//   [2023-04-14] If the copied creature has {X} in its mana cost, X is 0.
//   [2023-04-14] If the copied creature is copying something else, then the token enters the
//     battlefield as whatever that creature copied.
//   [2023-04-14] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     token enters the battlefield. Any “as [this creature] enters the battlefield” or “[this
//     creature] enters the battlefield with” abilities of the copied creature will also work.

const ONE_TEXT =
  "{1}{R}, {T}: Create a token that's a copy of another target creature you control. It gains haste. Sacrifice it at the beginning of the next end step. Activate only as a sorcery.";
const FIVE_TEXT =
  "{6}{R}{R}{R}, {T}: Create five tokens that are copies of another target creature you control. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.";

export default defineCard({
  name: "Orthion, Hero of Lavabrink",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: `${ONE_TEXT}\n${FIVE_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{R}", tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "other", of: "creature-you-control" }],
      // "It gains haste" — an effect on the token, not a copy exception
      // (Jaxis, the Troublemaker's shape).
      effect: { kind: "create-token-copy", of: 0, count: 1, gains: { keywords: ["haste"] }, sacrificeAtEndStep: true },
      resolve: null,
      text: ONE_TEXT,
    },
    {
      cost: { mana: "{6}{R}{R}{R}", tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: { kind: "create-token-copy", of: 0, count: 5, gains: { keywords: ["haste"] }, sacrificeAtEndStep: true },
      resolve: null,
      text: FIVE_TEXT,
    },
  ],
});
