import { defineCard } from "../define.js";

export default defineCard({
  name: "Kraul Stinger",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Assassin"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
