import { defineCard } from "../define.js";

// EDHREC rank 4685.

export default defineCard({
  name: "Scampering Surveyor",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Gnome"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, search your library for a basic land card or Cave card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { anyOf: [{ supertype: "basic", type: "land" }, { subtype: "Cave" }] },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "When this creature enters, search your library for a basic land card or Cave card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
