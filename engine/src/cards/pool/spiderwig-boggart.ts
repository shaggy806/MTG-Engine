import { defineCard } from "../define.js";

export default defineCard({
  name: "Spiderwig Boggart",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, target creature gains fear until end of turn. (It can't be blocked except by artifact creatures and/or black creatures.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "fear", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gains fear until end of turn.",
    },
  ],
});
