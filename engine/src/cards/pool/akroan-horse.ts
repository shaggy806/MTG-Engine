import { defineCard } from "../define.js";

// EDHREC rank 4448.
// Makes Soldier → use "Soldier Token".
//
// Rulings:
//   [2013-09-15] Akroan Horse's enters-the-battlefield ability doesn't target any opponent. In a
//     multiplayer game, you choose the opponent as the ability resolves.
//   [2013-09-15] In the last ability, “each opponent” refers to opponents of Akroan Horse's
//     controller. In most situations in two-player games, your opponent will control Akroan Horse
//     and you'll put Soldier tokens onto the battlefield.
//
// The opponent is chosen as the ability resolves (`choose-opponent`, not a target).

const ETB_TEXT = "When this creature enters, an opponent gains control of it.";
const UPKEEP_TEXT = "At the beginning of your upkeep, each opponent creates a 1/1 white Soldier creature token.";

export default defineCard({
  name: "Akroan Horse",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Horse"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: `Defender\n${ETB_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-opponent",
        then: { kind: "gain-control", target: "source", who: "that-player", untilEndOfTurn: false },
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1, who: "each-opponent" },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
