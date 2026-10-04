import { defineCard } from "../define.js";

// EDHREC rank 5167.
//
// Rulings:
//   [2011-01-22] If you cast a creature card from your graveyard, that card will be put on the
//     stack before entering. Flayer of the Hatebound won't trigger.
//   [2011-01-22] The creature that entered from your graveyard deals damage equal to its current
//     power (including any +1/+1 counters it entered with) to the target permanent or player. If
//     it's no longer on the battlefield when the ability resolves, its last known existence on the
//     battlefield is checked to determine its power.
//   [2011-01-22] Flayer of the Hatebound is the source of the ability, but it may be another
//     creature that is the source of the damage. If a black creature enters from your graveyard,
//     the ability could target a creature with protection from black, although the damage will be
//     prevented. It couldn't target a creature with protection from red.
//   [2011-01-22] Since damage is dealt by the creature, abilities like lifelink and deathtouch are
//     taken into account, even if the creature has left the battlefield by the time it deals
//     damage.
//   [2011-01-22] Flayer of the Hatebound's last ability will trigger even if a creature enters
//     from your graveyard under another player's control.

export default defineCard({
  name: "Flayer of the Hatebound",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 4,
  toughness: 2,
  text: "Undying (When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)\nWhenever this creature or another creature enters from your graveyard, that creature deals damage equal to its power to any target.",
  triggered: [
    {
      // Undying (rule 702.93) — Geralf's Mindcrusher's shape.
      trigger: { on: "dies", who: "self" },
      condition: {
        kind: "self-counters",
        counter: "+1/+1",
        compare: { op: "eq", n: 0 },
      },
      targets: [],
      effect: {
        kind: "put-onto-battlefield",
        target: "trigger-object",
        withCounters: { kind: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Undying (When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)",
    },
    {
      // "From your graveyard": a card you own, whoever it enters under (the
      // last ruling). The entering creature deals the damage, at its power as
      // it last existed if it has left (Warstorm Surge's shape).
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "creature", enteredFrom: "graveyard", ownedBy: "you" },
      },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { powerOf: "trigger-object" }, target: 0, from: "trigger-object" },
      resolve: null,
      text: "Whenever this creature or another creature enters from your graveyard, that creature deals damage equal to its power to any target.",
    },
  ],
});
