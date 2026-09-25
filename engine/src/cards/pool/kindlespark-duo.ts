import { defineCard } from "../define.js";

export default defineCard({
  name: "Kindlespark Duo",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Otter"],
  power: 1,
  toughness: 3,
  text: "{T}: This creature deals 1 damage to target opponent.\nWhenever you cast a noncreature spell, untap this creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to target opponent.",
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
