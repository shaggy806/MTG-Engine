import { defineCard } from "../define.js";

// EDHREC rank 811. Overloaded, "each card that's an instant or sorcery from
// your graveyard" is exiled at once, and each copy is its own "may" (rule
// 707.12a), cast in the order the player picks as this resolves (the
// rulings); the ones not cast cease to exist (704.5e).
const TEXT =
  "Exile target card that's an instant or sorcery from your graveyard. For each card exiled this way, copy it, and you may cast the copy without paying its mana cost. Exile Mizzix's Mastery.\n" +
  'Overload {5}{R}{R}{R} (You may cast this spell for its overload cost. If you do, change "target" in its text to "each.")';

const INSTANT_OR_SORCERY = { typesAnyOf: ["instant", "sorcery"] } as const;

export default defineCard({
  name: "Mizzix's Mastery",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: INSTANT_OR_SORCERY }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "cast-now", from: "exiled-this-way", copies: 1, free: true },
    ],
  },
  overload: {
    cost: "{5}{R}{R}{R}",
    effect: {
      kind: "sequence",
      effects: [
        { kind: "exile-graveyard", target: "you", filter: INSTANT_OR_SORCERY },
        { kind: "cast-now", from: "exiled-this-way", copies: 1, free: true },
      ],
    },
  },
  exileOnResolve: true,
});
