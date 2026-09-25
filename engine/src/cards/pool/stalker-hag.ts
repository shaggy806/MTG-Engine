import { defineCard } from "../define.js";

export default defineCard({
  name: "Stalker Hag",
  manaCost: "{B/G}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Hag"],
  power: 3,
  toughness: 2,
  keywords: ["swampwalk", "forestwalk"],
  text: "Swampwalk, forestwalk (This creature can't be blocked as long as defending player controls a Swamp or a Forest.)",
});
