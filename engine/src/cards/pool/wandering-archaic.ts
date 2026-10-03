import { defineCard } from "../define.js";

const TEXT =
  "Whenever an opponent casts an instant or sorcery spell, they may pay {2}. If they don't, you may copy that " +
  "spell. You may choose new targets for the copy.";

// A modal double-faced card; Explore the Vastlands is its back face. The
// caster decides whether to pay {2} as the trigger resolves, before their
// spell does (the ruling); the copy is the Archaic's controller's, and is
// made from the spell as it last was on the stack if it has gone since.
export default defineCard({
  name: "Wandering Archaic",
  manaCost: "{5}",
  colors: [],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 4,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "trigger-controller",
        options: [{ pay: "{2}", text: "Pay {2}." }],
        otherwise: {
          kind: "may",
          prompt: "Copy that spell?",
          effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Wandering Archaic", "Explore the Vastlands"],
});
