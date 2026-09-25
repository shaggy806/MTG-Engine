import { defineCard } from "../define.js";

export default defineCard({
  name: "Shaper Guildmage",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{W}, {T}: Target creature gains first strike until end of turn.\n{B}, {T}: Target creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{W}, {T}: Target creature gains first strike until end of turn.",
    },
    {
      cost: { mana: "{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, {T}: Target creature gets +1/+0 until end of turn.",
    },
  ],
});
