import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Shizo, Death's Storehouse",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text:
    "{T}: Add {B}.\n" +
    "{B}, {T}: Target legendary creature gains fear until end of turn. (It can't be blocked except by artifact creatures and/or black creatures.)",
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{B}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "fear", duration: "end-of-turn" },
      resolve: null,
      text: "{B}, {T}: Target legendary creature gains fear until end of turn.",
    },
  ],
});
