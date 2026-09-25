import { defineCard } from "../define.js";

export default defineCard({
  name: "Nephalia Moondrakes",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, target creature gains flying until end of turn.\n{4}{U}{U}, Exile this card from your graveyard: Creatures you control gain flying until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{U}{U}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "flying",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{4}{U}{U}, Exile this card from your graveyard: Creatures you control gain flying until end of turn.",
      zone: "graveyard",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gains flying until end of turn.",
    },
  ],
});
