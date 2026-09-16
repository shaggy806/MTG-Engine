import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Unstable Obelisk",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "{T}: Add {C}.\n" +
    "{7}, {T}, Sacrifice Unstable Obelisk: Destroy target permanent.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{7}", tap: true, sacrifice: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{7}, {T}, Sacrifice Unstable Obelisk: Destroy target permanent.",
    },
  ],
});
