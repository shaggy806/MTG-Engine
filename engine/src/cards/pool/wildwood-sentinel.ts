import { defineCard } from "../define.js";

export default defineCard({
  name: "Wildwood Sentinel",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 2,
  toughness: 2,
  text: "{2}: Put a +1/+1 counter on Wildwood Sentinel.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "add-counter",
        target: "source",
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "{2}: Put a +1/+1 counter on Wildwood Sentinel.",
    },
  ],
});
