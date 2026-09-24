import { defineCard } from "../define.js";

// Exile first, then the life — the printed order. `{ powerOf }` and "its
// controller" read the creature as it last existed on the battlefield (rule
// 608.2h), so a pumped creature gains its controller the pumped power.
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
      { kind: "exile", target: 0 },
      {
        kind: "gain-life",
        amount: { powerOf: 0 },
        toControllerOfTarget: 0,
      },
    ],
  },
});
