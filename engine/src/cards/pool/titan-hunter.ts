import { defineCard } from "../define.js";

// "At the beginning of **each player's** end step" — `who: "any"`. The
// intervening-if is the negation of `creature-died-this-turn`, and "that
// player" is the one whose end step it is, which is `PlayerScope`'s
// `"active-player"`.
export default defineCard({
  name: "Titan Hunter",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 5,
  text:
    "At the beginning of each player's end step, if no creatures died this turn, " +
    "Titan Hunter deals 4 damage to that player.\n" +
    "{1}{B}, Sacrifice a creature: You gain 4 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "not", of: { kind: "creature-died-this-turn" } },
      targets: [],
      effect: { kind: "damage", amount: 4, who: "active-player" },
      resolve: null,
      text:
        "At the beginning of each player's end step, if no creatures died this turn, " +
        "Titan Hunter deals 4 damage to that player.",
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "{1}{B}, Sacrifice a creature: You gain 4 life.",
    },
  ],
});
