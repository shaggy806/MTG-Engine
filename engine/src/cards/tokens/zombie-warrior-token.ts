import { defineCard } from "../define.js";

/** 4/4 black Zombie Warrior with vigilance — God-Eternal Oketra's token. */
export default defineCard({
  name: "Zombie Warrior Token",
  art: "2e06aa97-1611-4af6-8bad-32051927fcfd",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance",
});
