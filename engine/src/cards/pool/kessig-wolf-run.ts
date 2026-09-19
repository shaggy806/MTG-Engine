import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Kessig Wolf Run",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{X}{R}{G}, {T}: Target creature gets +X/+0 and gains trample until end of turn.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{X}{R}{G}", tap: true },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: "x", toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "{X}{R}{G}, {T}: Target creature gets +X/+0 and gains trample until end of turn.",
    },
  ],
});
