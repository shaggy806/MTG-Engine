import { defineCard } from "../define.js";

export default defineCard({
  name: "Mirri, Cat Warrior",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["first-strike", "forestwalk", "vigilance"],
  text: "First strike, forestwalk, vigilance (This creature deals combat damage before creatures without first strike, it can't be blocked as long as defending player controls a Forest, and attacking doesn't cause this creature to tap.)",
});
