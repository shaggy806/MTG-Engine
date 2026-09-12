import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic } from "../helpers.js";

export default defineCard({
  name: "Kessig Wolf Run",
  types: ["land"],
  text:
    "Kessig Wolf Run enters the battlefield tapped.\n" +
    "{T}: Add {C}.\n" +
    "{1}{R}, {T}: Target creature you control gets +X/+0 until end of turn, " +
    "where X is the amount of red mana spent to activate this ability.",
  static: [entersTappedStatic("Kessig Wolf Run")],
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      // needed-cards P10 — approximates "X is the amount of red mana spent"
      // as an ordinary {X} activated cost (Phase 11 EG-3): the engine has no
      // notion of which color paid which part of a cost, so this is a
      // player-chosen generic X plus the fixed {1}{R}, not "however much red
      // you choose to add beyond the fixed cost".
      cost: { mana: "{X}{1}{R}", tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: "x", toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{X}{1}{R}, {T}: Target creature you control gets +X/+0 until end of turn.",
    },
  ],
});
