import { defineCard } from "../define.js";

// EDHREC rank 2794.
//
// Rulings:
//   [2020-11-10] If a creature you control that's enchanted and equipped attacks, Reyav's ability
//     will trigger only once for that creature.
//   [2020-11-10] The creature needs to be enchanted or equipped at the moment it's declared as an
//     attacker to cause Reyav's ability to trigger. If the creature is no longer enchanted or
//     equipped (or no longer attacking) as the ability tries to resolve, the ability still
//     resolves.
// The `attacks` filter is matched as the attacker is declared and not again.
const TEXT =
  "Whenever a creature you control that's enchanted or equipped attacks, that creature gains double strike until end of turn.";

export default defineCard({
  name: "Reyav, Master Smith",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Artificer"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "attacks",
        who: "you-control",
        filter: { anyOf: [{ enchanted: true }, { equipped: true }] },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
