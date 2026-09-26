import { defineCard } from "../define.js";

export default defineCard({
  name: "Captain N'ghathrod",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Horror", "Pirate"],
  power: 3,
  toughness: 6,
  text:
    "Horrors you control have menace.\n" +
    "Whenever a Horror you control deals combat damage to a player, that player mills that many cards.\n" +
    "At the beginning of your end step, choose target artifact or creature card in an opponent's graveyard that was put there from their library this turn. Put it onto the battlefield under your control.",
  static: [
    {
      // The Captain is a Horror itself, so it has menace too.
      affects: { scope: "creatures-you-control", subtype: "Horror" },
      grantKeywords: ["menace"],
      text: "Horrors you control have menace.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtype: "Horror" },
      },
      targets: [],
      effect: { kind: "mill", target: "trigger-player", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever a Horror you control deals combat damage to a player, that player mills that many cards.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "opponent",
          filter: {
            typesAnyOf: ["artifact", "creature"],
            putIntoGraveyardFromLibraryThisTurn: true,
          },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "At the beginning of your end step, choose target artifact or creature card in an opponent's graveyard that was put there from their library this turn. Put it onto the battlefield under your control.",
    },
  ],
});
