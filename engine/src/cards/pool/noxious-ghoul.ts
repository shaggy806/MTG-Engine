import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 4496.
//
// "This creature or another Zombie" is two triggers (Doomwake Giant's shape):
// its own entry counts whatever its types, and any other Zombie's — anyone's.
// The creatures that get -1/-1 are the ones there as it resolves (rule 611.2c).

const TEXT =
  "Whenever this creature or another Zombie enters, all non-Zombie creatures get -1/-1 until end of turn.";

const SHRINK: EffectSpec = {
  kind: "modify-pt-all",
  filter: { type: "creature", notSubtypes: ["Zombie"] },
  power: -1,
  toughness: -1,
  duration: "end-of-turn",
};

export default defineCard({
  name: "Noxious Ghoul",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: SHRINK, resolve: null, text: TEXT },
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { subtype: "Zombie" }, otherOnly: true },
      targets: [],
      effect: SHRINK,
      resolve: null,
      text: TEXT,
    },
  ],
});
