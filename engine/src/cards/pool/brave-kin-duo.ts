import { defineCard } from "../define.js";

export default defineCard({
  name: "Brave-Kin Duo",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Mouse"],
  power: 1,
  toughness: 1,
  text: "{1}, {T}: Target creature gets +1/+1 until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, {T}: Target creature gets +1/+1 until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
