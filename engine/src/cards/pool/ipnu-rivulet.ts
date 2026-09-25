import { defineCard } from "../define.js";

export default defineCard({
  name: "Ipnu Rivulet",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{T}, Pay 1 life: Add {U}.\n{1}{U}, {T}, Sacrifice a Desert: Target player mills four cards. (They put the top four cards of their library into their graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {U}.",
    },
    {
      cost: { mana: "{1}{U}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 4 },
      resolve: null,
      text: "{1}{U}, {T}, Sacrifice a Desert: Target player mills four cards.",
    },
  ],
});
