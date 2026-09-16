import { defineCard } from "../define.js";

export default defineCard({
  name: "Farhaven Elf",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text:
    "When Farhaven Elf enters, you may search your library for a basic land " +
    "card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text:
        "When Farhaven Elf enters, you may search your library for a basic land " +
        "card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
