import { defineCard } from "../define.js";

// EDHREC rank 4942.
//
// Creeping Tar Pit's animate shape: a blue 2/1 Faerie with flying until end of
// turn, still a land.
const ANIMATE_TEXT =
  "{1}{U}: This land becomes a 2/1 blue Faerie creature with flying until end of turn. It's still a land.";

export default defineCard({
  name: "Faerie Conclave",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {U}.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 1,
        addTypes: ["creature"],
        addSubtypes: ["Faerie"],
        setColors: ["U"],
        keywords: ["flying"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
