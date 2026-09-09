import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Cinder Glade",
  types: ["land"],
  subtypes: ["Mountain", "Forest"],
  text:
    "Cinder Glade enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {R} or {G}.",
  static: [enterTappedUnlessLands("Cinder Glade", 2, "basic")],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
