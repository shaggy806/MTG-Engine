import { defineCard } from "../define.js";

export default defineCard({
  name: "Hunter's Prowess",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: 'Until end of turn, target creature gets +3/+3 and gains trample and "Whenever this creature deals combat damage to a player, draw that many cards."',
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          // "that many" — the damage dealt, which the trigger supplies.
          effect: { kind: "draw", amount: { triggerValue: true } },
          resolve: null,
          text: "Whenever this creature deals combat damage to a player, draw that many cards.",
        },
      },
    ],
  },
});
