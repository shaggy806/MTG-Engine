import { defineCard } from "../define.js";

export default defineCard({
  name: "Hunter's Insight",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Choose target creature you control. Whenever that creature deals combat damage to a player or planeswalker this turn, draw that many cards.",
  targets: ["creature-you-control"],
  // The printed card grants nothing visible, but "whenever that creature …
  // this turn" is the same shape as Hunter's Prowess's granted ability.
  effect: {
    kind: "grant-triggered",
    target: 0,
    duration: "end-of-turn",
    ability: {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever that creature deals combat damage to a player this turn, draw that many cards.",
    },
  },
});
