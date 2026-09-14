import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Woodland Cemetery",
  types: ["land"],
  text:
    "Woodland Cemetery enters the battlefield tapped unless you control a Swamp or a Forest.\n" +
    "{T}: Add {B} or {G}.",
  static: [checkLandStatic("Woodland Cemetery", ["Swamp", "Forest"])],
  activated: [manaTapAbility("B"), manaTapAbility("G")],
});
