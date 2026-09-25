import { defineCard } from "../define.js";

export default defineCard({
  name: "Cavern Crawler",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 3,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)\n{R}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
