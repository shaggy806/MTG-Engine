import { defineCard } from "../define.js";

export default defineCard({
  name: "Myr Turbine",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Create a 1/1 colorless Myr artifact creature token.\n{T}, Tap five untapped Myr you control: Search your library for a Myr creature card, put it onto the battlefield, then shuffle.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Myr Token", count: 1 },
      resolve: null,
      text: "{T}: Create a 1/1 colorless Myr artifact creature token.",
    },
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 5, filter: { subtype: "Myr", controlledBy: "you" } },
      },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Myr", type: "creature" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{T}, Tap five untapped Myr you control: Search your library for a Myr creature card, put it onto the battlefield, then shuffle.",
    },
  ],
});
