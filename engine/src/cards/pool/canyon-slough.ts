import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Canyon Slough",
  types: ["land"],
  subtypes: ["Swamp", "Mountain"],
  cycling: { cost: "{2}" },
  text:
    "({T}: Add {B} or {R}.)\n" +
    "This land enters tapped.\n" +
    "Cycling {2} ({2}, Discard this card: Draw a card.)",
  static: [entersTappedStatic("Canyon Slough")],
  activated: [manaTapAbility("B"), manaTapAbility("R")],
});
