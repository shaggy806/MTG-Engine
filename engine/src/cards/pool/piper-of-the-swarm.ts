import { defineCard } from "../define.js";

// EDHREC rank 3102.
// Makes Rat → use "Rat Token".
//
// Rulings:
//   [2019-10-04] The control-change effect of Piper of the Swarm's last ability lasts
//     indefinitely. It doesn't wear off during the cleanup step, and it doesn't expire if Piper of
//     the Swarm leaves the battlefield. In a multiplayer game, it does expire if you leave the
//     game.

const MENACE_TEXT = "Rats you control have menace.";
const STEAL_TEXT = "{2}{B}{B}, {T}, Sacrifice three Rats: Gain control of target creature.";

export default defineCard({
  name: "Piper of the Swarm",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 1,
  toughness: 3,
  text: `${MENACE_TEXT}\n{1}{B}, {T}: Create a 1/1 black Rat creature token.\n${STEAL_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Rat" },
      grantKeywords: ["menace"],
      text: MENACE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Rat Token", count: 1 },
      resolve: null,
      text: "{1}{B}, {T}: Create a 1/1 black Rat creature token.",
    },
    {
      cost: { mana: "{2}{B}{B}", tap: true, sacrifice: { filter: { subtype: "Rat" }, count: 3 } },
      targets: ["creature"],
      // Indefinite (the ruling): it outlasts the Piper.
      effect: { kind: "gain-control", target: 0, untilEndOfTurn: false },
      resolve: null,
      text: STEAL_TEXT,
    },
  ],
});
