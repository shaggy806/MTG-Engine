import { defineCard } from "../define.js";

export default defineCard({
  name: "Tura Kennerüd, Skyknight",
  manaCost: "{2}{W}{U}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an instant or sorcery spell, create a 1/1 white Soldier creature token.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, create a 1/1 white Soldier creature token.",
    },
  ],
});
