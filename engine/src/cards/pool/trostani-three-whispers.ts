import { defineCard } from "../define.js";

export default defineCard({
  name: "Trostani, Three Whispers",
  manaCost: "{G}{G/W}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 4,
  toughness: 4,
  text: "{1}{G}: Target creature gains deathtouch until end of turn.\n{G/W}: Target creature gains vigilance until end of turn.\n{2}{W}: Target creature gains double strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: Target creature gains deathtouch until end of turn.",
    },
    {
      cost: { mana: "{G/W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "vigilance", duration: "end-of-turn" },
      resolve: null,
      text: "{G/W}: Target creature gains vigilance until end of turn.",
    },
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{2}{W}: Target creature gains double strike until end of turn.",
    },
  ],
});
