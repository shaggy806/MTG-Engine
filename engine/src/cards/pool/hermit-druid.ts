import { defineCard } from "../define.js";

const TEXT =
  "{G}, {T}: Reveal cards from the top of your library until you reveal a basic land card. Put that card into your hand and all other cards revealed this way into your graveyard.";

// With no basic land left, every card is revealed and all of them go to
// the graveyard.
export default defineCard({
  name: "Hermit Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { type: "land", supertype: "basic" },
        put: "hand",
        rest: "graveyard",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
