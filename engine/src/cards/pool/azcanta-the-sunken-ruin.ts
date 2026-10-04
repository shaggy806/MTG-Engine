import { defineCard } from "../define.js";

// The back face of Search for Azcanta. Only the card taken is revealed; the
// rest go on the bottom in an order its controller picks.

export default defineCard({
  name: "Azcanta, the Sunken Ruin",
  art: "https://cards.scryfall.io/art_crop/back/1/a/1a7e242e-bb48-4134-a1c2-6033713d658f.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "(Transforms from Search for Azcanta.)\n{T}: Add {U}.\n{2}{U}, {T}: Look at the top four cards of your library. You may reveal a noncreature, nonland card from among them and put it into your hand. Put the rest on the bottom of your library in any order.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{2}{U}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { notTypes: ["creature", "land"] },
        destination: "hand",
        leftover: "bottom-any-order",
      },
      resolve: null,
      text: "{2}{U}, {T}: Look at the top four cards of your library. You may reveal a noncreature, nonland card from among them and put it into your hand. Put the rest on the bottom of your library in any order.",
    },
  ],
  faces: ["Search for Azcanta", "Azcanta, the Sunken Ruin"],
  transform: true,
});
