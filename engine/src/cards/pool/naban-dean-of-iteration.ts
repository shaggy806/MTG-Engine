import { defineCard } from "../define.js";

// EDHREC rank 6036.
//
// Rulings:
//   [2018-04-27] If a triggered ability is linked to a second ability, additional instances of
//     that triggered ability are also linked to that second ability. If the second ability refers
//     to "the exiled card," it refers to all cards exiled by instances of the triggered ability.
//   [2018-04-27] If a Wizard entering the battlefield at the same time as Naban (including Naban
//     itself) causes a triggered ability of a permanent you control to trigger, that ability
//     triggers an additional time.
//   [2018-04-27] In some cases involving linked abilities, an ability requires information about
//     "the exiled card." When this happens, the ability gets multiple answers. If these answers
//     are being used to determine the value of a variable, the sum is used. For example, if Elite
//     Arcanist's enters-the-battlefield ability triggers twice, two cards are exiled. The value of
//     X in the activation cost of Elite Arcanist's other ability is the sum of the two cards' mana
//     values. As the ability resolves, you create copies of both cards and can cast none, one, or
//     both of the copies in any order.
//   [2018-04-27] If you somehow control two Nabans, a Wizard entering the battlefield causes
//     abilities to trigger three times, not four. A third Naban causes abilities to trigger four
//     times, a fourth causes abilities to trigger five times, and so on.
//   [2018-04-27] Naban's effect doesn't copy the triggered ability; it just causes the ability to
//     trigger twice. Any choices made as you put the ability onto the stack, such as modes and
//     targets, are made separately for each instance of the ability. Any choices made on
//     resolution, such as whether to put counters on a permanent, are also made individually.
//   [2018-04-27] Naban affects a Wizard's own enters-the-battlefield triggered abilities as well
//     as other triggered abilities that trigger when that Wizard enters the battlefield. Such
//     triggered abilities start with "when" or "whenever."
//   [2018-04-27] Replacement effects are unaffected by Naban's first ability. For example, a
//     Wizard that enters the battlefield with one +1/+1 counter on it won't receive an additional
//     +1/+1 counter.
//   [2018-04-27] The trigger event doesn't have to specifically refer to "Wizards." For example,
//     an ability that triggers "whenever a creature enters the battlefield under your control"
//     would trigger twice if the entering creature is a Wizard.
//   [2018-04-27] Abilities that apply "as [this creature] enters the battlefield," such as
//     choosing a card name with Meddling Mage, are unaffected.
//   [2018-04-27] Look at each permanent as it exists on the battlefield, taking into account
//     continuous effects, to determine whether any triggered abilities will trigger multiple
//     times. For example, if you control Arcane Adaptation with Wizard as the chosen creature
//     type, a Runeclaw Bear entering the battlefield will cause any abilities it triggers to
//     trigger an additional time.

export default defineCard({
  name: "Naban, Dean of Iteration",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: "If a Wizard you control entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
  static: [
    {
      // Panharmonicon's shape, narrowed to a Wizard you control entering
      // (Naban itself included, as it enters).
      affects: { scope: "self" },
      doubleTriggers: { cause: "enters", filter: { subtype: "Wizard", controlledBy: "you" } },
      text:
        "If a Wizard you control entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
    },
  ],
});
