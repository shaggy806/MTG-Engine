import { defineCard } from "../define.js";

const TEXT = "{2}, {T}: Add {B} for each black creature card in your graveyard.";

export default defineCard({
  name: "Crypt of Agadeem",
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {B}.\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: { countInGraveyard: { type: "creature", colors: ["B"], ownedBy: "you" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
