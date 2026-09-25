import { defineCard } from "../define.js";

export default defineCard({
  name: "Vastwood Fortification",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature.",
  targets: ["creature"],
  effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
  faces: ["Vastwood Fortification", "Vastwood Thicket"],
});
