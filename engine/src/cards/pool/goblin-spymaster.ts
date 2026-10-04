import { defineCard } from "../define.js";

// EDHREC rank 5880.
//
// "That player" is the opponent whose end step it is — the active player —
// who creates (and controls) the token.
//
// Rulings:
//   [2016-11-08] If, during your declare attackers step, a creature you control is tapped or is
//     affected by a spell or ability that says it can't attack, then it doesn't attack, even if
//     you control one of Goblin Spymaster's tokens. If there's a cost associated with having a
//     creature attack, you aren't forced to pay that cost, so it doesn't have to attack in that
//     case either.

const TEXT =
  "At the beginning of each opponent's end step, that player creates a 1/1 red Goblin creature token with \"Creatures you control attack each combat if able.\"";

export default defineCard({
  name: "Goblin Spymaster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: `First strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "opponent" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token (Goblin Spymaster)", count: 1, who: "active-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
