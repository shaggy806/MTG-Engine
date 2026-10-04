import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3322.

export default defineCard({
  name: "Skarrg, the Rage Pits",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{R}{G}, {T}: Target creature gets +1/+1 and gains trample until end of turn.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{R}{G}", tap: true },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "{R}{G}, {T}: Target creature gets +1/+1 and gains trample until end of turn.",
    },
  ],
});
