import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Festering Thicket",
  types: ["land"],
  subtypes: ["Swamp", "Forest"],
  cycling: { cost: "{2}" },
  text:
    "Festering Thicket enters the battlefield tapped.\n" +
    "{T}: Add {B} or {G}.\n" +
    "Cycling {2}",
  static: [entersTappedStatic("Festering Thicket")],
  activated: [manaTapAbility("B"), manaTapAbility("G")],
});
