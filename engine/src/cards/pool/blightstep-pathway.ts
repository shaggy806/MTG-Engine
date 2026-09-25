import { defineCard } from "../define.js";

export default defineCard({
  name: "Blightstep Pathway",
  colors: [],
  types: ["land"],
  text: "{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  faces: ["Blightstep Pathway", "Searstep Pathway"],
});
