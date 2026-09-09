import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Sheltered Thicket",
  types: ["land"],
  subtypes: ["Mountain", "Forest"],
  cycling: { cost: "{2}" },
  text:
    "Sheltered Thicket enters the battlefield tapped.\n" +
    "{T}: Add {R} or {G}.\n" +
    "Cycling {2}",
  static: [entersTappedStatic("Sheltered Thicket")],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
