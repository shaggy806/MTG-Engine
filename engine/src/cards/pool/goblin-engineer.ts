import { defineCard } from "../define.js";

const ETB_TEXT =
  "When this creature enters, you may search your library for an artifact card, put it into your graveyard, then shuffle.";
const RETURN_TEXT =
  "{R}, {T}, Sacrifice an artifact: Return target artifact card with mana value 3 or less from your graveyard to the battlefield.";

// The target is chosen before the cost is paid, so it can't be the artifact
// being sacrificed (the ruling).
export default defineCard({
  name: "Goblin Engineer",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Artificer"],
  power: 1,
  toughness: 2,
  text: `${ETB_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "artifact" },
        destination: "graveyard",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{R}", tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [
        { kind: "card-in-graveyard", whose: "you", filter: { type: "artifact", manaValue: { op: "lte", n: 3 } } },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
