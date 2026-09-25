import { defineCard } from "../define.js";

export default defineCard({
  name: "Fireborn Knight",
  manaCost: "{R/W}{R/W}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 3,
  keywords: ["double-strike"],
  text: "Double strike\n{R/W}{R/W}{R/W}{R/W}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R/W}{R/W}{R/W}{R/W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{R/W}{R/W}{R/W}{R/W}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
