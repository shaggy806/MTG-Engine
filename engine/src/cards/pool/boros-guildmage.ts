import { defineCard } from "../define.js";

export default defineCard({
  name: "Boros Guildmage",
  manaCost: "{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{1}{R}: Target creature gains haste until end of turn.\n{1}{W}: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{R}: Target creature gains haste until end of turn.",
    },
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: Target creature gains first strike until end of turn.",
    },
  ],
});
