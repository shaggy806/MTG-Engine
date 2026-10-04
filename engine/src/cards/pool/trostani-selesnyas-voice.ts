import { defineCard } from "../define.js";

const LIFE_TEXT = "Whenever another creature you control enters, you gain life equal to that creature's toughness.";
const POPULATE_TEXT = "{1}{G}{W}, {T}: Populate. (Create a token that's a copy of a creature token you control.)";

// The toughness is the entering creature's, read as the ability resolves
// (or as it last existed, if it has left). Populate asks which creature
// token to copy when there's a real choice (rule 701.36a).
export default defineCard({
  name: "Trostani, Selesnya's Voice",
  manaCost: "{G}{G}{W}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 2,
  toughness: 5,
  text: `${LIFE_TEXT}\n${POPULATE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}{W}", tap: true },
      targets: [],
      effect: { kind: "populate" },
      resolve: null,
      text: POPULATE_TEXT,
    },
  ],
});
