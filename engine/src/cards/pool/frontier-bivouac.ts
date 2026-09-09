import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Frontier Bivouac",
  types: ["land"],
  text:
    "Frontier Bivouac enters the battlefield tapped.\n" +
    "{T}: Add {G}, {U}, or {R}.",
  static: [entersTappedStatic("Frontier Bivouac")],
  activated: [manaTapAbility("G"), manaTapAbility("U"), manaTapAbility("R")],
});
