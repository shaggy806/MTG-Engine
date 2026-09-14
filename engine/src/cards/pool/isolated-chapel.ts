import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Isolated Chapel",
  types: ["land"],
  text:
    "Isolated Chapel enters the battlefield tapped unless you control a Plains or a Swamp.\n" +
    "{T}: Add {W} or {B}.",
  static: [checkLandStatic("Isolated Chapel", ["Plains", "Swamp"])],
  activated: [manaTapAbility("W"), manaTapAbility("B")],
});
