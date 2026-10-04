import { defineCard } from "../define.js";

// EDHREC rank 2508.

const HASTE_TEXT = "Other Dinosaurs you control have haste.";
const TOKEN_TEXT = "When this creature enters, create a 3/3 green Dinosaur creature token with trample.";

export default defineCard({
  name: "Regisaur Alpha",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 4,
  toughness: 4,
  text: `${HASTE_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Dinosaur" },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Dinosaur Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
