import { describe, expect, it } from "vitest";

import { assignReplacements, suggestReplacements } from "../card-replacer.js";
import type { ReplacementTarget } from "../card-replacer.js";

/**
 * Two missing cards competing for one stand-in is the case the joint
 * assignment exists for, and it needs targets whose candidate lists genuinely
 * overlap. Real Scryfall shapes, so the scores come from the real scorer rather
 * than from a fixture that could drift away from it.
 */
const target = (name: string, manaCost: string, typeLine: string, pt?: [string, string]): ReplacementTarget => ({
  name,
  manaCost,
  typeLine,
  ...(pt ? { power: pt[0], toughness: pt[1] } : {}),
});

describe("assignReplacements", () => {
  it("hands back a short list of alternatives, not the whole search pool", () => {
    // The assignment searches a deeper pool (`ASSIGNMENT_POOL`, 12) than it
    // hands back. That width once reached the deck builder's review popup,
    // which laid every candidate out as a card image in one row and pushed
    // the card being replaced off the left edge of the screen.
    //
    // The cap is 8 rather than the 3 the popup draws, and the surplus is
    // deliberate: the popup shows the best three still *available*, and
    // availability shrinks as you pick — every choice puts a card in the deck
    // and singleton rules it out for every later target. With exactly three
    // it could only grey them out. Narrowing to three is the popup's job
    // (`ReplacementReview`'s `shown`), so the original hazard stays fixed.
    const targets = [
      target("Alpha", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Beta", "{1}{U}", "Instant"),
      target("Gamma", "{3}{W}", "Enchantment"),
    ];
    for (const assigned of assignReplacements(targets, {})) {
      expect(assigned.options.length, assigned.target).toBeLessThanOrEqual(8);
    }
  });

  it("keeps the card it actually chose among the alternatives it offers", () => {
    // The chosen stand-in can rank below the display cap — that is exactly
    // what the joint assignment does when it trades a favourite away — so
    // capping naively would offer alternatives to a card it never showed.
    const targets = [
      target("Alpha", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Beta", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Gamma", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Delta", "{2}{G}", "Creature — Beast", ["3", "3"]),
    ];
    for (const assigned of assignReplacements(targets, {})) {
      if (assigned.choice === null) continue;
      expect(
        assigned.options.map((o) => o.name),
        `${assigned.target} -> ${assigned.choice.name}`,
      ).toContain(assigned.choice.name);
    }
  });

  it("gives every target a distinct stand-in", () => {
    // Singleton is the whole reason the choices compete: one card cannot stand
    // in twice.
    const targets = [
      target("Alpha", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Beta", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Gamma", "{2}{G}", "Creature — Beast", ["3", "3"]),
    ];
    const chosen = assignReplacements(targets, {})
      .map((a) => a.choice?.name)
      .filter((n): n is string => n !== undefined);
    expect(chosen.length).toBeGreaterThan(1);
    expect(new Set(chosen).size).toBe(chosen.length);
  });

  it("beats first-come-first-served on total match quality", () => {
    // The property that matters, stated as the thing it must never lose to:
    // taking each target's own favourite in order, skipping any already taken.
    // The joint assignment can only ever match or beat that total, and on
    // overlapping lists it beats it.
    const targets = [
      target("A", "{1}{G}", "Creature — Elf Druid", ["1", "1"]),
      target("B", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("C", "{4}{G}{G}", "Creature — Wurm", ["6", "4"]),
      target("D", "{1}{G}", "Sorcery"),
      target("E", "{2}", "Artifact"),
    ];

    const assigned = assignReplacements(targets, {});
    const jointTotal = assigned.reduce((sum, a) => sum + (a.choice?.score ?? 0), 0);

    const taken = new Set<string>();
    let greedyTotal = 0;
    for (const t of targets) {
      const pick = suggestReplacements(t, { limit: 12 }).find((s) => !taken.has(s.name));
      if (pick !== undefined) {
        taken.add(pick.name);
        greedyTotal += pick.score;
      }
    }

    expect(jointTotal).toBeGreaterThanOrEqual(greedyTotal - 1e-9);
  });

  it("hands a contested stand-in to the target with the most to lose", () => {
    // The worked example: when one card suits two targets, it should go to the
    // one whose *alternatives* are worse, not the one whose score is highest.
    // Constructed directly so the arithmetic is checkable rather than
    // incidental — the scorer's real numbers are used, but the assertion is
    // about the rule.
    const targets = [
      target("Contested-A", "{4}{G}{G}", "Creature — Wurm", ["6", "4"]),
      target("Contested-B", "{4}{G}{G}", "Creature — Wurm", ["6", "4"]),
    ];
    const assigned = assignReplacements(targets, {});
    const [a, b] = assigned;

    // Both wanted the same card first; exactly one got it, and the other took
    // its own runner-up rather than being left with nothing.
    expect(a.options[0].name).toBe(b.options[0].name);
    expect(a.choice?.name).not.toBe(b.choice?.name);
    for (const one of assigned) expect(one.choice).not.toBeNull();

    // And the total is the better of the two ways round.
    const total = (a.choice?.score ?? 0) + (b.choice?.score ?? 0);
    const swapped =
      (a.options.find((s) => s.name === b.choice?.name)?.score ?? 0) +
      (b.options.find((s) => s.name === a.choice?.name)?.score ?? 0);
    expect(total).toBeGreaterThanOrEqual(swapped - 1e-9);
  });

  it("keeps each target's own ranked alternatives for the UI", () => {
    // The chosen stand-in is deliberately not always `options[0]` — that is the
    // point — so the alternatives have to survive for a person to override with.
    const targets = [
      target("One", "{2}{G}", "Creature — Beast", ["3", "3"]),
      target("Two", "{2}{G}", "Creature — Beast", ["3", "3"]),
    ];
    for (const a of assignReplacements(targets, {})) {
      expect(a.options.length).toBeGreaterThan(0);
      for (let i = 1; i < a.options.length; i += 1) {
        expect(a.options[i - 1].score).toBeGreaterThanOrEqual(a.options[i].score);
      }
    }
  });

  it("never suggests a card the deck already has", () => {
    const first = assignReplacements([target("X", "{2}{G}", "Creature — Beast", ["3", "3"])], {});
    const taken = first[0].choice?.name;
    expect(taken).toBeDefined();
    const second = assignReplacements(
      [target("X", "{2}{G}", "Creature — Beast", ["3", "3"])],
      { exclude: [taken as string] },
    );
    expect(second[0].choice?.name).not.toBe(taken);
  });

  it("returns a null choice rather than inventing one when nothing fits", () => {
    // An unparseable type line has no candidates at all; the target still has
    // to come back, with nothing assigned.
    const assigned = assignReplacements([target("Nonsense", "{1}", "")], {});
    expect(assigned).toHaveLength(1);
    expect(assigned[0].choice).toBeNull();
    expect(assigned[0].options).toHaveLength(0);
  });
});
