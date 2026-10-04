import { defineCard } from "../define.js";

// EDHREC rank 4771.
//
// Rulings:
//   [2021-04-16] If you cast Deadly Brew and control any creatures or planeswalkers as it
//     resolves, you must sacrifice one of them.
//   [2021-04-16] You cannot return the same permanent card that you sacrificed.
//   [2021-04-16] First the active player chooses which creature or planeswalker they'll sacrifice,
//     then each other player in turn order does the same, knowing choices made before their
//     choice. Then all those permanents are sacrificed simultaneously.
//   [2021-04-16] You choose which permanent card you're returning to your hand, if any, as Deadly
//     Brew resolves, after permanents are sacrificed.
// "If you sacrificed a permanent this way" is Tip the Scales' `this-way`
// condition, narrowed to you; "another" leaves out the card you sacrificed
// (`notThisWay`). A permanent card is anything but an instant or sorcery
// (Aether Helix).
const TEXT =
  "Each player sacrifices a creature or planeswalker of their choice. If you sacrificed a permanent this way, you may return another permanent card from your graveyard to your hand.";

export default defineCard({
  name: "Deadly Brew",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "each-player", filter: { typesAnyOf: ["creature", "planeswalker"] }, count: 1 },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "sacrificed", who: "you" },
        then: {
          kind: "may",
          prompt: "Return another permanent card from your graveyard to your hand?",
          effect: {
            kind: "return-from-graveyard",
            filter: { notTypes: ["instant", "sorcery"], notThisWay: "sacrificed" },
            destination: "hand",
            count: 1,
          },
        },
      },
    ],
  },
});
