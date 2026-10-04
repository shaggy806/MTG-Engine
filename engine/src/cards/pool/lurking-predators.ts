import { defineCard } from "../define.js";

// EDHREC rank 3162.
//
// Rulings:
//   [2009-10-01] If an opponent casts a spell, this ability triggers and is put on the stack on
//     top of that spell. This ability will resolve (meaning that a revealed creature card will
//     enter) before the spell resolves.
//   [2009-10-01] You must put the revealed card onto the battlefield if it's a creature card. If
//     it's not a creature card and you don't put it on the bottom of your library, it stops being
//     revealed and simply remains on top of your library.

const TEXT =
  "Whenever an opponent casts a spell, reveal the top card of your library. If it's a creature card, put it onto the battlefield. Otherwise, you may put that card on the bottom of your library.";

export default defineCard({
  name: "Lurking Predators",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: {
        kind: "reveal-top",
        then: {
          kind: "conditional",
          condition: { kind: "target", index: 0, filter: { type: "creature" } },
          then: { kind: "put-onto-battlefield", target: 0 },
          else: {
            kind: "may",
            prompt: "Put that card on the bottom of your library?",
            effect: { kind: "put-on-library", target: 0, position: "bottom" },
          },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
