import { defineCard } from "../define.js";

// EDHREC rank 5411.

export default defineCard({
  name: "Spider-Woman, Stunning Savior",
  manaCost: "{1}{W/U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Human", "Hero"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nVenom Blast — Artifacts and creatures your opponents control enter tapped.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "opponent" },
        tapped: true,
      },
      text: "Venom Blast — Artifacts and creatures your opponents control enter tapped.",
    },
  ],
});
