import { defineCard } from "../define.js";

// Its controller manifests dread whether or not the creature is destroyed
// (an indestructible one), as long as it's still a legal target (608.2b);
// "its controller" as it last existed (rule 701.62a).
export default defineCard({
  name: "Unwanted Remake",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target creature. Its controller manifests dread.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "manifest-dread", who: { controllerOfTarget: 0 } },
    ],
  },
});
