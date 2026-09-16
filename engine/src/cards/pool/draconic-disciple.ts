import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Draconic Disciple",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text:
    "{T}: Add one mana of any color.\n" +
    "{7}, {T}, Sacrifice this creature: Create a 5/5 red Dragon creature token with flying.",
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
    {
      cost: { mana: "{7}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text:
        "{7}, {T}, Sacrifice this creature: Create a 5/5 red Dragon creature token with flying.",
    },
  ],
});
