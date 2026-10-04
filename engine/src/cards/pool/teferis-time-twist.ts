import { defineCard } from "../define.js";

// EDHREC rank 2678.
//
// Rulings:
//   [2019-05-03] The permanent returns untapped unless another effect causes it to enter the
//     battlefield tapped.
//   [2019-05-03] To determine whether the entering permanent is entering as a creature, consider
//     any effects that will modify that permanent’s characteristics once it’s on the battlefield,
//     including that permanent’s own abilities that affect only itself and effects from other
//     objects.
//   [2019-05-03] If a token is exiled this way, it will cease to exist and won’t return to the
//     battlefield.
//   [2019-05-03] Auras attached to the exiled permanent will be put into their owners’ graveyards.
//     Equipment attached to the exiled permanent will become unattached and remain on the
//     battlefield. Any counters on the exiled permanent will cease to exist. Once the exiled
//     permanent returns, it’s considered a new object with no relation to the object that it was.
//   [2019-05-03] A creature returned to the battlefield this way enters the battlefield with one
//     +1/+1 counter if it would otherwise enter with no +1/+1 counters.

const TEXT =
  "Exile target permanent you control. Return that card to the battlefield under its owner's control at the " +
  "beginning of the next end step. If it enters as a creature, it enters with an additional +1/+1 counter on it.";

// A token exiled ceases to exist and doesn't return. "If it enters as a
// creature" is judged as it is on the battlefield, every effect applied (the
// ruling); the counter is on it as it enters, so its enters triggers see it.
export default defineCard({
  name: "Teferi's Time Twist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: TEXT,
  targets: [{ kind: "permanent", whose: "you", filter: {} }],
  effect: {
    kind: "flicker",
    target: 0,
    thenCounters: { kind: "+1/+1", amount: 1, onlyIf: { type: "creature" }, entering: true },
    returnAt: "next-end-step",
    returnText:
      "Return the exiled card to the battlefield under its owner's control. If it enters as a creature, it enters with an additional +1/+1 counter on it.",
  },
});
