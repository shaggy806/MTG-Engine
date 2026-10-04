import { defineCard } from "../define.js";

// EDHREC rank 6204.
//
// Rulings:
//   [2018-04-27] Neither sacrificed creature can be the target of Whisper's ability.
//   [2018-04-27] Whisper can be one of the creatures sacrificed to activate its ability.
//
// Targets are chosen before costs are paid (rule 601.2c before 601.2h), so
// the sacrificed creatures aren't in the graveyard to be targeted.
const TEXT = "{T}, Sacrifice two creatures: Return target creature card from your graveyard to the battlefield.";

export default defineCard({
  name: "Whisper, Blood Liturgist",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "creature" }, count: 2 } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
