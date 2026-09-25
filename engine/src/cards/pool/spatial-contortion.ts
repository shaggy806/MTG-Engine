import { defineCard } from "../define.js";

export default defineCard({
  name: "Spatial Contortion",
  manaCost: "{1}{C}",
  colors: [],
  types: ["instant"],
  text: "({C} represents colorless mana.)\nTarget creature gets +3/-3 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 3, toughness: -3, duration: "end-of-turn" },
});
