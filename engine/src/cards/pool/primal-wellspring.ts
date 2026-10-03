import { defineCard } from "../define.js";

const MANA_TEXT =
  "{T}: Add one mana of any color. When that mana is spent to cast an instant or sorcery spell, copy that spell " +
  "and you may choose new targets for the copy.";

// The back face of Primal Amulet. The rider rides on the mana, not the land:
// it fires even if Wellspring has left by then, once for each unit of it
// spent on one spell, and copies the spell even if it's countered before the
// rider resolves (the rulings) — `"trigger-spell"`, as it last was on the
// stack. The mana may pay for anything; only an instant or sorcery is copied.
export default defineCard({
  name: "Primal Wellspring",
  art: "https://cards.scryfall.io/art_crop/back/d/4/d4d379b5-7f56-4a7d-a4ac-131fc3d579c6.jpg",
  types: ["land"],
  text: `(Transforms from Primal Amulet.)\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        whenSpent: {
          spell: { typesAnyOf: ["instant", "sorcery"] },
          effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
          text: "When that mana is spent to cast an instant or sorcery spell, copy that spell and you may choose new targets for the copy.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  faces: ["Primal Amulet", "Primal Wellspring"],
  transform: true,
});
