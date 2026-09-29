import { defineCard } from "../define.js";

const ETB_TEXT = "When this artifact enters, each opponent sacrifices three creatures of their choice.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, put target creature card from a graveyard onto the battlefield under your control. It's a Phyrexian in addition to its other types.";

// "It's a Phyrexian" is in place as it enters, as the Enduring cycle's "It's
// an enchantment" is: "whenever a Phyrexian enters" sees one arrive.
export default defineCard({
  name: "Portal to Phyrexia",
  manaCost: "{9}",
  colors: [],
  types: ["artifact"],
  text: `${ETB_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 3 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "any", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true, addSubtypes: ["Phyrexian"] },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
