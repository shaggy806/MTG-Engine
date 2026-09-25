import { defineCard } from "../define.js";

export default defineCard({
  name: "Blisterspit Gremlin",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Gremlin"],
  power: 1,
  toughness: 1,
  text: "{1}, {T}: This creature deals 1 damage to each opponent.\nWhenever you cast a noncreature spell, untap this creature.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{1}, {T}: This creature deals 1 damage to each opponent.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, untap this creature.",
    },
  ],
});
