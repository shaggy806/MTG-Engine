import { defineCard } from "../define.js";

export default defineCard({
  name: "Taxi Driver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Pilot"],
  power: 3,
  toughness: 1,
  text: "{1}, {T}: Target creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{1}, {T}: Target creature gains haste until end of turn.",
    },
  ],
});
