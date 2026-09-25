import { defineCard } from "../define.js";


export default defineCard({
  name: "Jin Sakai, Ghost of Tsushima",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Samurai"],
  power: 2,
  toughness: 4,
  text: "Whenever Jin Sakai deals combat damage to a player, draw a card.\nWhenever a creature you control attacks a player, if no other creatures are attacking that player, choose one —\n• Standoff — It gains double strike until end of turn.\n• Ghost — It can't be blocked this turn.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever Jin Sakai deals combat damage to a player, draw a card.",
    },
    {
      // "If no other creatures are attacking that player" is an intervening-if,
      // checked again as it resolves.
      trigger: {
        on: "attacks",
        who: "you-control",
        filter: { type: "creature" },
        defender: "player",
        aloneAgainstDefender: true,
      },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Standoff — It gains double strike until end of turn.",
            effect: { kind: "grant-keyword", target: "trigger-object", keyword: "double-strike", duration: "end-of-turn" },
          },
          {
            text: "Ghost — It can't be blocked this turn.",
            effect: { kind: "grant-keyword", target: "trigger-object", keyword: "unblockable", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: "Whenever a creature you control attacks a player, if no other creatures are attacking that player, choose one —\n• Standoff — It gains double strike until end of turn.\n• Ghost — It can't be blocked this turn.",
    },
  ],
});
