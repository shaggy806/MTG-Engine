import { defineCard } from "../define.js";


export default defineCard({
  name: "Geode Grotto",
  art: "https://cards.scryfall.io/art_crop/back/3/d/3d715e9f-223d-462e-8ce3-eebbaf1cd021.jpg",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: "(Transforms from Dowsing Device.)\n{T}: Add {R}.\n{2}{R}, {T}: Until end of turn, target creature gains haste and gets +X/+0, where X is the number of artifacts you control. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{2}{R}", tap: true },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
          {
            kind: "modify-pt",
            target: 0,
            power: { countOf: { type: "artifact", controlledBy: "you" } },
            toughness: 0,
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{2}{R}, {T}: Until end of turn, target creature gains haste and gets +X/+0, where X is the number of artifacts you control. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  faces: ["Dowsing Device", "Geode Grotto"],
  transform: true,
});
