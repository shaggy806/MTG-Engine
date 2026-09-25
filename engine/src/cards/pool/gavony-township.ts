import { defineCard } from "../define.js";

export default defineCard({
  name: "Gavony Township",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}{G}{W}, {T}: Put a +1/+1 counter on each creature you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{G}{W}", tap: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "{2}{G}{W}, {T}: Put a +1/+1 counter on each creature you control.",
    },
  ],
});
