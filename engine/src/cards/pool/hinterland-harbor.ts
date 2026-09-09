import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Hinterland Harbor",
  types: ["land"],
  text:
    "Hinterland Harbor enters the battlefield tapped unless you control a Forest or an Island.\n" +
    "{T}: Add {G} or {U}.",
  static: [checkLandStatic("Hinterland Harbor", ["Forest", "Island"])],
  activated: [manaTapAbility("G"), manaTapAbility("U")],
});
