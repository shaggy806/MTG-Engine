import { defineCard } from "../define.js";


export default defineCard({
  name: "Starwinder",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Leviathan"],
  power: 7,
  toughness: 7,
  text: "Whenever a creature you control deals combat damage to a player, you may draw that many cards.\nWarp {2}{U}{U} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      // "That many": the combat damage it dealt (the trigger value).
      effect: { kind: "may", prompt: "Draw that many cards?", effect: { kind: "draw", amount: { triggerValue: true } } },
      resolve: null,
      text: "Whenever a creature you control deals combat damage to a player, you may draw that many cards.",
    },
  ],
  warp: { cost: "{2}{U}{U}" },
});
