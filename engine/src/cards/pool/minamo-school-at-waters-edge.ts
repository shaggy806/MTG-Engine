import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Minamo, School at Water's Edge",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {U}.\n{U}, {T}: Untap target legendary permanent.",
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{U}", tap: true },
      targets: [{ kind: "permanent", filter: { supertype: "legendary" } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{U}, {T}: Untap target legendary permanent.",
    },
  ],
});
