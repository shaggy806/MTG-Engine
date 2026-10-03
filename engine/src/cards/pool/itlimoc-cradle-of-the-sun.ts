import { defineCard } from "../define.js";

// The back face of Growing Rites of Itlimoc.
export default defineCard({
  name: "Itlimoc, Cradle of the Sun",
  art: "https://cards.scryfall.io/art_crop/back/0/0/004524bf-b249-4dac-9c10-44d57143feb9.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "(Transforms from Growing Rites of Itlimoc.)\n{T}: Add {G}.\n{T}: Add {G} for each creature you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { type: "creature", controlledBy: "you" } } },
      resolve: null,
      text: "{T}: Add {G} for each creature you control.",
    },
  ],
  faces: ["Growing Rites of Itlimoc", "Itlimoc, Cradle of the Sun"],
  transform: true,
});
