import { defineCard } from "../define.js";

// The back face of Storm the Vault.
export default defineCard({
  name: "Vault of Catlacan",
  art: "https://cards.scryfall.io/art_crop/back/c/1/c16ba84e-a0cc-4c6c-9b80-713247b8fef9.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "(Transforms from Storm the Vault.)\n{T}: Add one mana of any color.\n{T}: Add {U} for each artifact you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: { countOf: { type: "artifact", controlledBy: "you" } } },
      resolve: null,
      text: "{T}: Add {U} for each artifact you control.",
    },
  ],
  faces: ["Storm the Vault", "Vault of Catlacan"],
  transform: true,
});
