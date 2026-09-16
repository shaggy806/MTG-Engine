import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Vitu-Ghazi, the City-Tree",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{2}{G}{W}, {T}: Create a 1/1 green Saproling creature token.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}{G}{W}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "{2}{G}{W}, {T}: Create a 1/1 green Saproling creature token.",
    },
  ],
});
