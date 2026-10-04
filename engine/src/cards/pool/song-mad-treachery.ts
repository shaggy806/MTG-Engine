import { defineCard } from "../define.js";

// EDHREC rank 5919.
//
// Rulings:
//   [2020-09-25] If an effect allows you to play a specific modal double-faced card, you may cast
//     it as a spell or play it as a land, as determined by which face you choose to play. If an
//     effect allows you to cast (rather than "play") a specific modal double-faced card, you can't
//     play it as a land.
//   [2020-09-25] Gaining control of a creature doesn't cause you to gain control of any Auras or
//     Equipment attached to it.
//   [2020-09-25] There is a single triangle icon in the top left corner of the front face. There
//     is a double triangle icon in the top left corner of the back face.
//   [2020-09-25] To determine whether it is legal to play a modal double-faced card, consider only
//     the characteristics of the face you're playing and ignore the other face's characteristics.
//   [2020-09-25] The mana value of a modal double-faced card is based on the characteristics of
//     the face that's being considered. On the stack and battlefield, consider whichever face is
//     up. In all other zones, consider only the front face. This is different than how the mana
//     value of a transforming double-faced card is determined.
//   [2020-09-25] If an effect allows you to play a land or cast a spell from among a group of
//     cards, you may play or cast a modal double-faced card with any face that fits the criteria
//     of that effect.
//   [2020-09-25] Song-Mad Treachery can target any creature, even one that's untapped or one you
//     already control.
//   [2020-09-25] A modal double-faced card can't be transformed or be put onto the battlefield
//     transformed. Ignore any instruction to transform a modal double-faced card or to put one
//     onto the battlefield transformed.
//   [2020-09-25] In the Commander variant, a double-faced card's color identity is determined by
//     the mana costs and mana symbols in the rules text of both faces combined. If either face has
//     a color indicator or basic land type, those are also considered.
//   [2020-09-25] If an effect instructs a player to choose a card name, the name of either face
//     may be chosen. If that effect or a linked ability refers to a spell with the chosen name
//     being cast and/or a land with the chosen name being played, it considers only the chosen
//     name, not the other face's name.
//   [2020-09-25] If an effect puts a double-faced card onto the battlefield, it enters with its
//     front face up. If that front face can't be put onto the battlefield, it doesn't enter the
//     battlefield.

export default defineCard({
  name: "Song-Mad Treachery",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Gain control of target creature until end of turn. Untap that creature. It gains haste until end of turn.",
  targets: ["creature"],
  // Act of Treason's shape.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      { kind: "untap", target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
    ],
  },
  faces: ["Song-Mad Treachery", "Song-Mad Ruins"],
});
