import { defineCard } from "../define.js";

const RIOT_TEXT = "Riot (This creature enters with your choice of a +1/+1 counter or haste.)";
const DAMAGE_TEXT =
  "{3}{R}: This creature deals 2 damage divided as you choose among one or two targets. Activate only if this creature has a +1/+1 counter on it.";

// The 2 is divided as the ability is activated (the ruling): 2 to one
// target, or 1 to each of two — and with two, one gone illegal still takes
// only its 1. Once activated it resolves whatever becomes of the counters or
// of the Hellkite (the ruling).
export default defineCard({
  name: "Skarrgan Hellkite",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["riot", "flying"],
  text: `${RIOT_TEXT}\nFlying\n${DAMAGE_TEXT}`,
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 1 } },
      targets: [{ kind: "any-number", of: "any-target", min: 1, max: 2 }],
      divided: { total: 2, slot: 0 },
      effect: { kind: "damage-divided", from: 0 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
