import { defineCard } from "../define.js";

// EDHREC rank 6662. Its Adventure is Profane Insight (profane-insight.ts).

export default defineCard({
  name: "Foulmire Knight",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
  faces: ["Foulmire Knight", "Profane Insight"],
  adventure: true,
});
