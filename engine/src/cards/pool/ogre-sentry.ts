import { defineCard } from "../define.js";

export default defineCard({
  name: "Ogre Sentry",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender",
});
