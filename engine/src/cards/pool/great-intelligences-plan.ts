import { defineCard } from "../define.js";

// EDHREC rank 6709.
//
// Rulings:
//   - A player facing a villainous choice first chooses one of the two
//     options, then all of that option is done.
//   - They can always choose either option, even one that would do nothing
//     (an empty hand to discard from).
//
// Dr. Eggman's villainous choice (rule 701.56), asked of one player: the
// target opponent, named through `controllerOfTarget` — a player slot names
// the player itself. The option chosen is the spell's controller's effect,
// with `"that-player"` the opponent: "they discard three cards" is theirs,
// and "you may cast a spell from your hand without paying its mana cost" is
// yours (Maelstrom Archangel's `cast-now`, a "may"). The draw comes first and
// isn't optional; an opponent who has become an illegal target stops the
// whole spell (rule 608.2b — its only target).
const TEXT =
  "Draw three cards. Then target opponent faces a villainous choice — They discard three cards, or you may cast a spell from your hand without paying its mana cost.";

export default defineCard({
  name: "Great Intelligence's Plan",
  manaCost: "{4}{U}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        choices: [
          {
            text: "They discard three cards.",
            effect: { kind: "discard", target: "that-player", amount: 3 },
          },
          {
            text: "You may cast a spell from your hand without paying its mana cost.",
            effect: { kind: "cast-now", from: "hand", free: true },
          },
        ],
      },
    ],
  },
});
