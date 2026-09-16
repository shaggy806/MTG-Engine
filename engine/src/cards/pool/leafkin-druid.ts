import { defineCard } from "../define.js";

// One printed ability with a conditional output, modelled as two mutually
// exclusive gated abilities — so exactly one is ever offered, which is what
// "add {G}{G} **instead**" means.
export default defineCard({
  name: "Leafkin Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Druid"],
  power: 0,
  toughness: 3,
  text: "{T}: Add {G}. If you control four or more creatures, add {G}{G} instead.",
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: {
        kind: "not",
        of: { kind: "controls", filter: { type: "creature" }, atLeast: 4 },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { type: "creature" }, atLeast: 4 },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: "{T}: Add {G}{G} if you control four or more creatures.",
    },
  ],
});
