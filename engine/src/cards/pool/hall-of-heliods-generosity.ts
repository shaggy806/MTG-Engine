import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Hall of Heliod's Generosity",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{1}{W}, {T}: Put target enchantment card from your graveyard on top of your library.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: "{1}{W}, {T}: Put target enchantment card from your graveyard on top of your library.",
    },
  ],
});
