import { defineCard } from "../define.js";

const TEXT =
  "{2}, {T}, Sacrifice this token: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

/** Lander — a colorless artifact token (Horizon Explorer). */
export default defineCard({
  name: "Lander Token",
  art: "85ef1950-219f-401b-8ff5-914f9aaec122",
  types: ["artifact"],
  subtypes: ["Lander"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
