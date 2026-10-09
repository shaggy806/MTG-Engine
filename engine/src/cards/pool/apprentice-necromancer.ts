import { defineCard } from "../define.js";

const TEXT =
  "{B}, {T}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield. " +
  "That creature gains haste. At the beginning of the next end step, sacrifice it.";

// "Sacrifice it" is yours to do (rule 701.21a): a creature someone else has
// taken by the end step stays (`sacrifice-target`), and one that has left
// and come back is a new object the delayed ability doesn't know (rule 400.7).
export default defineCard({
  name: "Apprentice Necromancer",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{B}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          // "Gains haste" has no duration: it lasts as long as it stays.
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "permanent" },
          {
            kind: "delayed-trigger",
            at: "next-end-step",
            effect: { kind: "sacrifice-target", target: 0 },
            text: "Sacrifice the creature Apprentice Necromancer returned to the battlefield.",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
