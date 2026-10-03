import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Add one mana of any type that a land you control could produce.";
const ANIMATE_TEXT =
  "{3}: Until end of turn, this land becomes an X/X green Plant creature with reach, where X is the greatest mana value among your commanders. It's still a land.";

// "Any type" a land you control could produce — rule 106.7, costs and
// legality ignored, none of their restrictions or riders (the rulings). X is
// read as the ability resolves, wherever the commanders are, as they are now
// (the ruling), and fixed for the turn (rule 608.2h).
export default defineCard({
  name: "Cactus Preserve",
  types: ["land"],
  subtypes: ["Desert"],
  text: `This land enters tapped.\n${MANA_TEXT}\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { producedBy: "your-lands", anyType: true }, amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: { greatestCommanderManaValue: true },
        toughness: { greatestCommanderManaValue: true },
        addTypes: ["creature"],
        addSubtypes: ["Plant"],
        setColors: ["G"],
        keywords: ["reach"],
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
