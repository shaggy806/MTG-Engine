import { defineCard } from "../define.js";

export default defineCard({
  name: "Ambush Viper",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 1,
  keywords: ["flash", "deathtouch"],
  text: "Flash, deathtouch",
});
