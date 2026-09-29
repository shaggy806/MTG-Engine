import { defineCard } from "../define.js";

export default defineCard({
  name: "Edward Kenway",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin", "Pirate"],
  power: 5,
  toughness: 5,
  text:
    "At the beginning of your end step, create a Treasure token for each tapped Assassin, Pirate, and/or Vehicle you control.\n" +
    "Whenever a Vehicle you control deals combat damage to a player, look at the top card of that player's library, then exile it face down. You may play that card for as long as it remains exiled.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Treasure Token",
        // Each permanent counts once, however many of the three it is (the
        // 2024-07-05 ruling) — a filter over permanents, not a sum per type.
        count: {
          countOf: {
            controlledBy: "you",
            tapped: true,
            anyOf: [{ subtype: "Assassin" }, { subtype: "Pirate" }, { subtype: "Vehicle" }],
          },
        },
      },
      resolve: null,
      text: "At the beginning of your end step, create a Treasure token for each tapped Assassin, Pirate, and/or Vehicle you control.",
    },
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtype: "Vehicle" },
      },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        // "That player's library" — the player dealt the damage.
        whose: "trigger-player",
        duration: "while-exiled",
        // Looked at, then exiled face down: only Edward's controller knows
        // what it is (rule 406.3).
        faceDown: true,
      },
      resolve: null,
      text: "Whenever a Vehicle you control deals combat damage to a player, look at the top card of that player's library, then exile it face down. You may play that card for as long as it remains exiled.",
    },
  ],
});
