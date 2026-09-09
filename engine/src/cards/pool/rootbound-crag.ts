import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Rootbound Crag",
  types: ["land"],
  text:
    "Rootbound Crag enters the battlefield tapped unless you control a Mountain or a Forest.\n" +
    "{T}: Add {R} or {G}.",
  static: [checkLandStatic("Rootbound Crag", ["Mountain", "Forest"])],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
