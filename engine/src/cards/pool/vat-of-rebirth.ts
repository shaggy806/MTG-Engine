import { defineCard } from "../define.js";

// EDHREC rank 2639.
// Marionette Apprentice's trigger shape ("another creature or artifact you
// control is put into a graveyard from the battlefield").
const OIL_TEXT =
  "Whenever another artifact or creature you control is put into a graveyard from the battlefield, put an oil counter on this artifact.";
const RETURN_TEXT =
  "{2}{B}, {T}, Remove four oil counters from this artifact: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.";

export default defineCard({
  name: "Vat of Rebirth",
  manaCost: "{B}",
  colors: ["B"],
  types: ["artifact"],
  text: `${OIL_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["artifact", "creature"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "oil", amount: 1 },
      resolve: null,
      text: OIL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true, removeCounter: { kind: "oil", count: 4 } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
      sorcerySpeed: true,
    },
  ],
});
