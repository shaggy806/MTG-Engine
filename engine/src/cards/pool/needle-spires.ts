import { defineCard } from "../define.js";

// EDHREC rank 5547.
//
// Rulings:
//   [2016-01-22] When a land becomes a creature, that doesn't count as having a creature enter the
//     battlefield. The permanent was already on the battlefield; it only changed its types.
//     Abilities that trigger whenever a creature enters the battlefield won't trigger.
//   [2016-01-22] An ability that turns a land into a creature also sets that creature's power and
//     toughness. If the land was already a creature (for example, if it was the target of a spell
//     with awaken), this will overwrite the previous effect that set its power and toughness.
//     Effects that modify its power or toughness will continue to apply no matter when they
//     started to take effect. The same is true for counters that change its power or toughness
//     (such as +1/+1 counters) and effects that switch its power and toughness. For example, if
//     Needle Spires has been made a 0/0 creature with three +1/+1 counters on it, activating its
//     last ability will turn it into a 5/4 creature that's still a land.
//   [2016-01-22] This land is colorless until the last ability gives it colors.
//   [2016-01-22] A land that becomes a creature may be affected by "summoning sickness." You can't
//     attack with it or use any of its {T} abilities (including its mana abilities) unless it
//     began your most recent turn on the battlefield under your control. Note that summoning
//     sickness cares about when that permanent came under your control, not when it became a
//     creature nor when it entered the battlefield.
//
// Creeping Tar Pit's shape.

const ANIMATE_TEXT =
  "{2}{R}{W}: Until end of turn, this land becomes a 2/1 red and white Elemental creature with double strike. It's still a land.";

export default defineCard({
  name: "Needle Spires",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {R} or {W}.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
    },
    {
      cost: { mana: "{2}{R}{W}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 1,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        setColors: ["R", "W"],
        keywords: ["double-strike"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
