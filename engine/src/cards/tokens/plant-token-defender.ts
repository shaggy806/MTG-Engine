import { defineCard } from "../define.js";

// Dowsing Dagger // Lost Vale's Plant token: a 0/2 green Plant with defender
// (the pool's "Plant Token" is a 0/1).
export default defineCard({
  name: "Plant Token (Defender)",
  art: "642d1d93-22d0-43f9-8691-6790876185a0",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)",
});
