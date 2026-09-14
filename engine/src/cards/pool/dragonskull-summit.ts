import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Dragonskull Summit",
  types: ["land"],
  text:
    "Dragonskull Summit enters the battlefield tapped unless you control a Swamp or a Mountain.\n" +
    "{T}: Add {B} or {R}.",
  static: [checkLandStatic("Dragonskull Summit", ["Swamp", "Mountain"])],
  activated: [manaTapAbility("B"), manaTapAbility("R")],
});
