import { defineCard } from "../define.js";

// EDHREC rank 5038.
//
// Rulings:
//   [2018-12-07] In a multiplayer game, if a player loses the game, triggered abilities that
//     player controls are removed from the stack and no more from that player can be added. This
//     means that if a creature an opponent controls dies while you control Fecundity, and you lose
//     the game before Fecundity’s triggered ability resolves (perhaps because you lost the game at
//     the same time that the creature died), that player won’t draw a card.

export default defineCard({
  name: "Fecundity",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever a creature dies, that creature's controller may draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      // The dead creature's controller as it last existed (Massacre Wurm's
      // `"trigger-controller"`) is asked, and the draw is theirs (Edric's shape).
      effect: {
        kind: "each-player-may",
        who: "trigger-controller",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Whenever a creature dies, that creature's controller may draw a card.",
    },
  ],
});
