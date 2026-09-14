import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Glacial Fortress",
  types: ["land"],
  text:
    "Glacial Fortress enters the battlefield tapped unless you control a Plains or an Island.\n" +
    "{T}: Add {W} or {U}.",
  static: [checkLandStatic("Glacial Fortress", ["Plains", "Island"])],
  activated: [manaTapAbility("W"), manaTapAbility("U")],
});
