import { defineCard } from "../define.js";

export default defineCard({
  name: "Searstep Pathway",
  art: "https://cards.scryfall.io/art_crop/back/0/c/0ce39a19-f51d-4a35-ae80-5b82eb15fcff.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  faces: ["Blightstep Pathway", "Searstep Pathway"],
});
