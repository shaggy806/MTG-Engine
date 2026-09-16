import { defineCard } from "../define.js";

// The life gain is read *before* the exile, since `{ powerOf }` needs the
// creature to still be somewhere it can be measured.
export default defineCard({
  name: "Swords to Plowshares",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature. Its controller gains life equal to its power.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "gain-life",
        amount: { powerOf: 0 },
        toControllerOfTarget: 0,
      },
      { kind: "exile", target: 0 },
    ],
  },
});
