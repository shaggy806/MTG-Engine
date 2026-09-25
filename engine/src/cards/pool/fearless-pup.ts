import { defineCard } from "../define.js";

export default defineCard({
  name: "Fearless Pup",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nBoast — {2}{R}: This creature gets +2/+0 until end of turn. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Boast — {2}{R}: This creature gets +2/+0 until end of turn.",
      boast: true,
    },
  ],
});
