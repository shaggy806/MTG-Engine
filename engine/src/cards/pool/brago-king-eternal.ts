import { defineCard } from "../define.js";

const TEXT =
  "Whenever Brago deals combat damage to a player, exile any number of target nonland permanents you " +
  "control, then return those cards to the battlefield under their owner's control.";

// Brago may blink itself (the ruling); everything chosen is exiled together
// and returns together, each seeing the others enter.
export default defineCard({
  name: "Brago, King Eternal",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Noble"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "any-number", of: { kind: "permanent", whose: "you", filter: { notTypes: ["land"] } } }],
      effect: { kind: "flicker", target: { from: 0 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
