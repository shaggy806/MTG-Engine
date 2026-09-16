import { entersTappedStatic, manaTapAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Sky Diamond",
  manaCost: "{2}",
  types: ["artifact"],
  text: "Sky Diamond enters tapped.\n{T}: Add {U}.",
  static: [entersTappedStatic("Sky Diamond")],
  activated: [manaTapAbility("U")],
});
