import { defineCard } from "../define.js";

export default defineCard({
  name: "Dispersal Technician",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Artificer"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, you may return target artifact to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact"],
      effect: {
        kind: "may",
        prompt: "Return target artifact to its owner's hand?",
        effect: { kind: "return-to-hand", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may return target artifact to its owner's hand.",
    },
  ],
});
