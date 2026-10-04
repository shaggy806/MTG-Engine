import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// Rulings:
//   [2023-09-01] The copy remembers any decisions that were made for the original spell as it was
//     cast, including values chosen for X in its mana cost and whether any alternative or
//     additional costs were chosen. For example, if the original creature spell had kicker and its
//     kicker cost was paid, the copy will also be kicked.
//   [2023-09-01] A resolving copy of a permanent spell becomes a token, so the token isn't
//     "created." Effects that care about a token being created won't interact with a token that
//     enters the battlefield from Archmage of Echoes's ability.
//
// `copy-spell` keeps the original's {X} and the costs paid for it, and a copy
// of a permanent spell becomes a token as it resolves (Volo's shape).

const COPY_TEXT = "Whenever you cast a Faerie or Wizard permanent spell, copy it. (The copy becomes a token.)";

export default defineCard({
  name: "Archmage of Echoes",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying, ward {2}\n${COPY_TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: {
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
          anyOf: [{ subtype: "Faerie" }, { subtype: "Wizard" }],
        },
      },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
