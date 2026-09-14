import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Sunpetal Grove",
  types: ["land"],
  text:
    "Sunpetal Grove enters the battlefield tapped unless you control a Forest or a Plains.\n" +
    "{T}: Add {G} or {W}.",
  static: [checkLandStatic("Sunpetal Grove", ["Forest", "Plains"])],
  activated: [manaTapAbility("G"), manaTapAbility("W")],
});
