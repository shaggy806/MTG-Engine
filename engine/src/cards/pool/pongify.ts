import { defineCard } from "../define.js";

// Beast Within in blue, on a creature only. "It can't be regenerated" is a
// no-op — regeneration isn't modeled.
export default defineCard({
  name: "Pongify",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Destroy target creature. It can't be regenerated. Its controller creates a 3/3 green Ape " +
    "creature token.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Ape Token", count: 1, who: "target-controller" },
    ],
  },
});
