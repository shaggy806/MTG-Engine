import { defineCard } from "../define.js";

export default defineCard({
  name: "Archon of Justice",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature dies, exile target permanent.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["permanent"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "When this creature dies, exile target permanent.",
    },
  ],
});
