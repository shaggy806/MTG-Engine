import { defineCard } from "../define.js";

export default defineCard({
  name: "Invasion Tactics",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "When this enchantment enters, creatures you control get +2/+2 until end of turn.\nWhenever one or more Allies you control deal combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When this enchantment enters, creatures you control get +2/+2 until end of turn.",
    },
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Ally" },
        combat: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever one or more Allies you control deal combat damage to a player, draw a card.",
    },
  ],
});
