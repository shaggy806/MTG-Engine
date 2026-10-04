import { defineCard } from "../define.js";

// EDHREC rank 5033.
//
// Rulings:
//   [2023-11-10] Any enters-the-battlefield abilities of the copied permanent will trigger when
//     the token enters the battlefield. Any "as [this permanent] enters the battlefield" or "[this
//     permanent] enters the battlefield with" abilities of the target permanent will also work.
//   [2023-11-10] If the copied permanent is a token, the new token that's created copies the
//     original characteristics of that token as stated by the effect that created the token (with
//     the listed exceptions).
//   [2023-11-10] If the copied permanent has {X} in its mana cost, X is 0.
//   [2023-11-10] If the copied permanent is copying something else, then the token enters the
//     battlefield as whatever that permanent copied (with the listed exceptions).
//   [2023-11-10] The token copies exactly what was printed on the original permanent, with the
//     listed exceptions (unless that permanent is copying something else or is a token; see
//     below). It doesn't copy whether that permanent is tapped or untapped, whether it has any
//     counters on it or any Auras or Equipment attached to it, or any non-copy effects that have
//     changed its types, color, power and toughness, and so on.

export default defineCard({
  name: "Saheeli, the Sun's Brilliance",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 2,
  text: "{U}{R}, {T}: Create a token that's a copy of another target creature or artifact you control, except it's an artifact in addition to its other types. It gains haste. Sacrifice it at the beginning of the next end step.",
  activated: [
    {
      cost: { mana: "{U}{R}", tap: true },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["creature", "artifact"] } } }],
      // "Artifact in addition" is a copy exception (a copy of the token is an
      // artifact too); "it gains haste" is an effect on the token, not a copy
      // exception (Orthion, Hero of Lavabrink's shape).
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        exceptions: { addTypes: ["artifact"] },
        gains: { keywords: ["haste"] },
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text: "{U}{R}, {T}: Create a token that's a copy of another target creature or artifact you control, except it's an artifact in addition to its other types. It gains haste. Sacrifice it at the beginning of the next end step.",
    },
  ],
});
