import { defineCard } from "../define.js";

export default defineCard({
  name: "Tuknir Deathlock",
  manaCost: "{R}{R}{G}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{R}{G}, {T}: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{R}{G}, {T}: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
