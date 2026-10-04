import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 4035.
//
// Rulings:
//   [2024-02-02] Suspend is a keyword that represents three abilities. The first is a static
//     ability that allows you to exile the card from your hand with the specified number of time
//     counters (the number before the dash) on it by paying its suspend cost (listed after the
//     dash). The second is a triggered ability that removes a time counter from the suspended card
//     at the beginning of each of your upkeeps. The third is a triggered ability that gives you
//     the option to cast the card when the last time counter is removed.
//   [2024-02-02] You can exile a card in your hand using suspend any time you could cast that
//     card. Consider its card type, any effects that modify when you could cast it (such as flash)
//     and any other effects that stop you from casting it (such as from Meddling Mage's ability)
//     to determine if and when you can do this. Whether you could actually complete all steps in
//     casting the card is irrelevant. For example, you can exile a card with suspend that has no
//     mana cost or that requires a target even if no legal targets are available at that time.
//   [2024-02-02] If the first triggered ability of suspend (the one that removes time counters) is
//     countered, no time counter is removed. The ability will trigger again at the beginning of
//     the card's owner's next upkeep.
//   [2024-02-02] When the last time counter is removed, the second triggered ability of suspend
//     (the one that lets you cast the card) triggers. It doesn't matter why the last time counter
//     was removed or what effect removed it.
//   [2024-02-02] A card with no mana cost can't be cast normally; you'll need a way to cast it for
//     an alternative cost or without paying its mana cost, such as by suspending it.
//   [2024-02-02] Cards exiled with suspend are exiled face up.
//   [2024-02-02] If you cast a card "without paying its mana cost," such as with suspend, you
//     can't choose to cast it for any alternative costs. You can, however, pay additional costs.
//     If the card has any mandatory additional costs, you must pay those if you want to cast the
//     card.
//   [2024-02-02] If a card with no mana cost is given an alternative cost equal to its mana cost
//     (by Snapcaster Mage, for example), that cost cannot be paid and the card cannot be cast this
//     way.
//   [2024-02-02] Due to a recent rules change to suspend, you are no longer required to cast the
//     suspended card as the second triggered ability of suspend resolves. Instead, as the second
//     triggered ability resolves, you may cast the card. Timing permissions based on the card's
//     type are ignored. If you don't cast the card, it remains exiled with no time counters on it,
//     and it's no longer suspended.
//   [2024-02-02] Exiling a card with suspend isn't casting that card. This action doesn't use the
//     stack and can't be responded to.
//   [2024-02-02] If the second triggered ability is countered, the card can't be cast. It remains
//     exiled with no time counters on it, and it's no longer suspended.
//   [2024-02-02] If an effect refers to a "suspended card," that means a card that (1) has
//     suspend, (2) is in exile, and (3) has one or more time counters on it.
//   [2024-02-02] The mana value of a spell cast without paying its mana cost is determined by its
//     mana cost, even though that cost wasn't paid.
//   [2024-02-02] If the spell requires any targets, those targets are chosen when the spell is
//     finally cast, not when it's exiled.
//   [2024-02-02] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.

export default defineCard({
  name: "Lotus Bloom",
  colors: [],
  types: ["artifact"],
  text: "Suspend 3—{0} (Rather than cast this card from your hand, pay {0} and exile it with three time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost.)\n{T}, Sacrifice this artifact: Add three mana of any one color.",
  suspend: { n: 3, cost: "{0}" },
  activated: [
    addManaAbility({
      mana: "any-color",
      amount: 3,
      sacrifice: "self",
      text: "{T}, Sacrifice this artifact: Add three mana of any one color.",
    }),
  ],
});
