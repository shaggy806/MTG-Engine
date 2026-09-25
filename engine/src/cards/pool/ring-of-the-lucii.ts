import { defineCard } from "../define.js";

export default defineCard({
  name: "Ring of the Lucii",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "{T}: Add {C}{C}.\n{2}, {T}, Pay 1 life: Tap target nonland permanent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
    {
      cost: { mana: "{2}", tap: true, payLife: 1 },
      targets: ["nonland-permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}, {T}, Pay 1 life: Tap target nonland permanent.",
    },
  ],
});
