import { defineCard } from "../define.js";
import { firebending, manaTapAbility } from "../helpers.js";

const TAPPED_TEXT = "This land enters tapped unless you control a basic land.";
const GRANT_TEXT =
  "{1}{R}, {T}: Target creature you control gains firebending 4 until end of turn. (Whenever it attacks, add {R}{R}{R}{R}. This mana lasts until end of combat.)";

export default defineCard({
  name: "Fire Nation Palace",
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {R}.\n${GRANT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { supertype: "basic", type: "land" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{1}{R}", tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "grant-triggered", target: 0, ability: firebending(4), duration: "end-of-turn" },
      resolve: null,
      text: GRANT_TEXT,
    },
  ],
});
