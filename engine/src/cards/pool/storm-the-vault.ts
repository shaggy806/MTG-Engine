import { defineCard } from "../define.js";

// EDHREC rank 3529.
// Makes Treasure → uses "Treasure Token".
//
// Rulings:
//   [2018-01-19] Storm the Vault's first ability can trigger more than once in a turn if creatures
//     you control deal combat damage at different times in a turn (most likely because one or more
//     has first strike) or if creatures you control deal combat damage to more than one player at
//     once.
//   [2018-01-19] The last ability of Storm the Vault doesn't trigger if you don't control five or
//     more artifacts as your end step begins. If it does trigger but you don't control five or
//     more artifacts as it resolves, it does nothing.
//
// The damage trigger is batched once per player per damage event. The end-step
// clause is an intervening-if (rule 603.4), asked as it triggers and resolves.
const DAMAGE_TEXT =
  "Whenever one or more creatures you control deal combat damage to a player, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";
const TRANSFORM_TEXT =
  "At the beginning of your end step, if you control five or more artifacts, transform Storm the Vault.";

export default defineCard({
  name: "Storm the Vault",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${DAMAGE_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature" },
        combat: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 5 },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Storm the Vault", "Vault of Catlacan"],
  transform: true,
});
