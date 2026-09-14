import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Clifftop Retreat",
  types: ["land"],
  text:
    "Clifftop Retreat enters the battlefield tapped unless you control a Mountain or a Plains.\n" +
    "{T}: Add {R} or {W}.",
  static: [checkLandStatic("Clifftop Retreat", ["Mountain", "Plains"])],
  activated: [manaTapAbility("R"), manaTapAbility("W")],
});
