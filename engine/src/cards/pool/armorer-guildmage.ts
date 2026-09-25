import { defineCard } from "../define.js";

export default defineCard({
  name: "Armorer Guildmage",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{B}, {T}: Target creature gets +1/+0 until end of turn.\n{G}, {T}: Target creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, {T}: Target creature gets +1/+0 until end of turn.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G}, {T}: Target creature gets +0/+1 until end of turn.",
    },
  ],
});
