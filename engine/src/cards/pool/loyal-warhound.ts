import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, if an opponent controls more lands than you, search your library for a basic Plains card, put it onto the battlefield tapped, then shuffle.";

// An intervening-if (rule 603.4): checked as it enters and again as it
// resolves.
export default defineCard({
  name: "Loyal Warhound",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 3,
  toughness: 1,
  keywords: ["vigilance"],
  text: `Vigilance\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "opponent-controls-more", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtype: "Plains" },
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
