import { defineCard } from "../define.js";

export default defineCard({
  name: "Cradle of the Accursed",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{3}, {T}, Sacrifice this land: Create a 2/2 black Zombie creature token. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: "{3}, {T}, Sacrifice this land: Create a 2/2 black Zombie creature token. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
