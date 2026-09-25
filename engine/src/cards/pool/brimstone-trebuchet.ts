import { defineCard } from "../define.js";

export default defineCard({
  name: "Brimstone Trebuchet",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender", "reach"],
  text: "Defender, reach\n{T}: This creature deals 1 damage to each opponent.\nWhenever a Knight you control enters, untap this creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{T}: This creature deals 1 damage to each opponent.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Knight" } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever a Knight you control enters, untap this creature.",
    },
  ],
});
