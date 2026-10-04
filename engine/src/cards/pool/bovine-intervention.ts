import { defineCard } from "../define.js";

// EDHREC rank 3909.
// Makes Ox → new token "Ox Token".
//
// Rulings:
//   [2024-04-12] If the target artifact or creature is an illegal target by the time Bovine
//     Intervention tries to resolve, the spell doesn’t resolve. No player creates an Ox token. If
//     the target is legal but not destroyed (most likely because it has indestructible), its
//     controller does create an Ox token.

// Beast Within's shape: the token goes to the target's (last-known)
// controller, whether or not the destroy took (the ruling).
export default defineCard({
  name: "Bovine Intervention",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target artifact or creature. Its controller creates a 2/2 white Ox creature token.",
  targets: ["artifact-or-creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Ox Token", count: 1, who: "target-controller" },
    ],
  },
});
