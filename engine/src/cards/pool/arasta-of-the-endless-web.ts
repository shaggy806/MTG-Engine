import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent casts an instant or sorcery spell, create a 1/2 green Spider creature token with reach.";

export default defineCard({
  name: "Arasta of the Endless Web",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Spider"],
  power: 3,
  toughness: 5,
  keywords: ["reach"],
  text: `Reach\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "1/2 Green Spider Token (Reach)", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
