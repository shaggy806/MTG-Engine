import { defineCard } from "../define.js";

export default defineCard({
  name: "Dega Disciple",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{B}, {T}: Target creature gets -2/-0 until end of turn.\n{R}, {T}: Target creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, {T}: Target creature gets -2/-0 until end of turn.",
    },
    {
      cost: { mana: "{R}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}, {T}: Target creature gets +2/+0 until end of turn.",
    },
  ],
});
