import { defineCard } from "../define.js";

const SCRY_TEXT = "When The Grey Havens enters, scry 1.";
const COLOR_TEXT = "{T}: Add one mana of any color among legendary creature cards in your graveyard.";

export default defineCard({
  name: "The Grey Havens",
  supertypes: ["legendary"],
  types: ["land"],
  text: `${SCRY_TEXT}\n{T}: Add {C}.\n${COLOR_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { colorAmong: { type: "creature", supertype: "legendary" }, zone: "graveyard" },
        amount: 1,
      },
      resolve: null,
      text: COLOR_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});
