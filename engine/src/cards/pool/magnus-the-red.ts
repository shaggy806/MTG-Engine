import { defineCard } from "../define.js";

export default defineCard({
  name: "Magnus the Red",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Primarch"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Unearthly Power — Instant and sorcery spells you cast cost {1} less to cast for each " +
    "creature token you control.\n" +
    "Blade of Magnus — Whenever Magnus the Red deals combat damage to a player, create a 3/3 " +
    "red Spawn creature token.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { typesAnyOf: ["instant", "sorcery"], controlledBy: "you" },
        reduceGeneric: { countOf: { type: "creature", token: true, controlledBy: "you" } },
      },
      text:
        "Unearthly Power — Instant and sorcery spells you cast cost {1} less to cast for each " +
        "creature token you control.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spawn Token", count: 1 },
      resolve: null,
      text:
        "Blade of Magnus — Whenever Magnus the Red deals combat damage to a player, create a 3/3 " +
        "red Spawn creature token.",
    },
  ],
});
