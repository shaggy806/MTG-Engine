import { defineCard } from "../define.js";

// EDHREC rank 5567.
//
// Rulings:
//   [2010-03-01] When a land becomes a creature, that doesn't count as having a creature enter.
//     The permanent was already on the battlefield; it only changed its types. Abilities that
//     trigger whenever a creature enters won't trigger.
//   [2010-03-01] A land that becomes a creature may be affected by "summoning sickness." You can't
//     attack with it or use any of its {T} abilities (including its mana abilities) unless it
//     began your most recent turn on the battlefield under your control. Note that summoning
//     sickness cares about when that permanent came under your control, not when it became a
//     creature.
//   [2018-12-07] Once Celestial Colonnade has attacked, tapping it for mana won't remove it from
//     combat.
//   [2018-12-07] If Celestial Colonnade can't attack unless you pay a cost that includes a mana
//     payment, you may attack with it and tap it to pay for that cost. It will still attack in
//     this case.
// Creeping Tar Pit's shape.
const ANIMATE_TEXT =
  "{3}{W}{U}: Until end of turn, this land becomes a 4/4 white and blue Elemental creature with flying and vigilance. It's still a land.";

export default defineCard({
  name: "Celestial Colonnade",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {W} or {U}.\n${ANIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
    },
    {
      cost: { mana: "{3}{W}{U}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 4,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        setColors: ["W", "U"],
        keywords: ["flying", "vigilance"],
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
