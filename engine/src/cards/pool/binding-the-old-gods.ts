import { defineCard } from "../define.js";

export default defineCard({
  name: "Binding the Old Gods",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n" +
    "I — Destroy target nonland permanent an opponent controls.\n" +
    "II — Search your library for a Forest card, put it onto the battlefield tapped, then shuffle.\n" +
    "III — Creatures you control gain deathtouch until end of turn.",
  chapters: [
    {
      at: [1],
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "I — Destroy target nonland permanent an opponent controls.",
    },
    {
      at: [2],
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Forest" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "II — Search your library for a Forest card, put it onto the battlefield tapped, then shuffle.",
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "III — Creatures you control gain deathtouch until end of turn.",
    },
  ],
});
