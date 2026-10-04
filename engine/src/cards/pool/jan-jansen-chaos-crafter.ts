import { defineCard } from "../define.js";

// EDHREC rank 4135.
// Makes Construct → new token "Construct Token (Jan Jansen, Chaos Crafter)" (new, 1/1 colorless).
// Makes Treasure → use "Treasure Token".

export default defineCard({
  name: "Jan Jansen, Chaos Crafter",
  manaCost: "{R}{W}{B}",
  colors: ["W", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gnome", "Artificer"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\n{T}, Sacrifice an artifact creature: Create two Treasure tokens.\n{T}, Sacrifice a noncreature artifact: Create two 1/1 colorless Construct artifact creature tokens.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { types: ["artifact", "creature"] } } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: "{T}, Sacrifice an artifact creature: Create two Treasure tokens.",
    },
    {
      cost: {
        mana: null,
        tap: true,
        sacrifice: { filter: { type: "artifact", notTypes: ["creature"] } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Construct Token (Jan Jansen, Chaos Crafter)", count: 2 },
      resolve: null,
      text: "{T}, Sacrifice a noncreature artifact: Create two 1/1 colorless Construct artifact creature tokens.",
    },
  ],
});
