import { defineCard } from "../define.js";

export default defineCard({
  name: "Obyra's Attendants",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying",
  faces: ["Obyra's Attendants", "Desperate Parry"],
  adventure: true,
});
