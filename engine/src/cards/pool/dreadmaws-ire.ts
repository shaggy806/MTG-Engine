import { defineCard } from "../define.js";

// EDHREC rank 5692.

export default defineCard({
  name: "Dreadmaw's Ire",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Until end of turn, target attacking creature gets +2/+2 and gains trample and \"Whenever this creature deals combat damage to a player, destroy target artifact that player controls.\"",
  // Hunter's Prowess's shape, with Trygon Predator's "that player" target.
  targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "artifact" } }],
          effect: { kind: "destroy", target: 0 },
          resolve: null,
          text: "Whenever this creature deals combat damage to a player, destroy target artifact that player controls.",
        },
      },
    ],
  },
});
