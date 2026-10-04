import { defineCard } from "../define.js";

// EDHREC rank 4045.
// Makes Construct → new token "Construct Token (Metallurgic Summonings)" (scaffolded).
//
// Rulings:
//   [2016-09-20] Metallurgic Summonings's first ability resolves before the spell that caused it
//     to trigger.
//   [2016-09-20] For a spell with {X} in its mana cost, use the value chosen for X to determine
//     its mana value. For example, Clash of Wills is an instant spell with mana cost {X}{U}. If
//     you chose 2 as the value of X, then Clash of Wills has mana value 3, and Metallurgic
//     Summonings's ability will create a 3/3 token.
//   [2016-09-20] If Metallurgic Summonings's first ability resolves and the spell that caused it
//     to trigger has been countered, use that spell's mana value as it last existed on the stack
//     to determine the value of X.
//   [2016-09-20] The number of artifacts you control is checked only as you activate Metallurgic
//     Summonings's last ability. It's not checked again as it resolves.

const MV = { manaValueOf: "trigger-object" } as const;

export default defineCard({
  name: "Metallurgic Summonings",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you cast an instant or sorcery spell, create an X/X colorless Construct artifact creature token, where X is that spell's mana value.\n{3}{U}{U}, Exile this enchantment: Return all instant and sorcery cards from your graveyard to your hand. Activate only if you control six or more artifacts.",
  activated: [
    {
      cost: { mana: "{3}{U}{U}", tap: false, exileSelf: true },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 6 },
      targets: [],
      effect: {
        kind: "return-from-graveyard",
        filter: { typesAnyOf: ["instant", "sorcery"] },
        destination: "hand",
        count: "all",
      },
      resolve: null,
      text: "{3}{U}{U}, Exile this enchantment: Return all instant and sorcery cards from your graveyard to your hand. Activate only if you control six or more artifacts.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Construct Token (Metallurgic Summonings)",
        count: 1,
        basePt: { power: MV, toughness: MV },
      },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, create an X/X colorless Construct artifact creature token, where X is that spell's mana value.",
    },
  ],
});
