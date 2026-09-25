import { defineCard } from "../define.js";

export default defineCard({
  name: "Vermiculos",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 1,
  toughness: 1,
  text: "Whenever an artifact enters, this creature gets +4/+4 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 4, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever an artifact enters, this creature gets +4/+4 until end of turn.",
    },
  ],
});
