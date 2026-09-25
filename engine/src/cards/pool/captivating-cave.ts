import { defineCard } from "../define.js";

export default defineCard({
  name: "Captivating Cave",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: "{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n{4}, {T}, Sacrifice this land: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "{4}, {T}, Sacrifice this land: Put two +1/+1 counters on target creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
