import { defineCard } from "../define.js";

const TEXT = "When this creature enters, you may put a land card from your hand onto the battlefield tapped.";

export default defineCard({
  name: "Arboreal Grazer",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sloth", "Beast"],
  power: 0,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        enterTapped: true,
        leftover: "stay",
        filter: { type: "land" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
