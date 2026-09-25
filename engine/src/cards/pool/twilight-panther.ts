import { defineCard } from "../define.js";

export default defineCard({
  name: "Twilight Panther",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Spirit"],
  power: 1,
  toughness: 2,
  text: "{B}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{B}: This creature gains deathtouch until end of turn.",
    },
  ],
});
