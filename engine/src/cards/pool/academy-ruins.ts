import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Academy Ruins",
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{1}{U}, {T}: Put target artifact card from your graveyard on top of your library.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: "{1}{U}, {T}: Put target artifact card from your graveyard on top of your library.",
    },
  ],
});
