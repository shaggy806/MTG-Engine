/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do. A `target` field is an index
 * into the spell's or ability's chosen targets, or the literal `"source"`.
 */

import type { Keyword } from "./cards.js";
import type { ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef } from "./target.js";

export type EffectTargetRef = number | "source";
export type PtDuration = "end-of-turn" | "permanent";

/** A declarative effect. Grows as milestones add vocabulary. */
export type EffectSpec =
  | { readonly kind: "damage"; readonly amount: number; readonly target: number }
  | { readonly kind: "add-mana"; readonly mana: ManaType; readonly amount: number }
  | { readonly kind: "draw"; readonly amount: number }
  | { readonly kind: "gain-life"; readonly amount: number }
  | { readonly kind: "tap"; readonly target: number }
  | { readonly kind: "untap"; readonly target: number }
  | { readonly kind: "destroy"; readonly target: number }
  | {
      readonly kind: "modify-pt";
      readonly target: EffectTargetRef;
      readonly power: number;
      readonly toughness: number;
      readonly duration: PtDuration;
    }
  | {
      readonly kind: "add-counter";
      readonly target: EffectTargetRef;
      readonly counter: string;
      readonly amount: number;
    }
  | {
      readonly kind: "grant-keyword";
      readonly target: EffectTargetRef;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
    }
  | {
      readonly kind: "create-token";
      /** Name of a token definition in the {@link CardRegistry}. */
      readonly token: string;
      readonly count: number;
    }
  | {
      /** Attach the source (an Aura/Equipment) to a target permanent. */
      readonly kind: "attach";
      readonly target: number;
    };

/** Primitive mutations an effect can perform. Implemented by the engine. */
export interface EffectApi {
  dealDamage(target: TargetRef, amount: number): void;
  draw(player: PlayerId, count: number): void;
  gainLife(player: PlayerId, amount: number): void;
  loseLife(player: PlayerId, amount: number): void;
  addMana(player: PlayerId, mana: ManaType, amount: number): void;
  tapPermanent(target: TargetRef): void;
  untapPermanent(target: TargetRef): void;
  destroyPermanent(target: TargetRef): void;
  modifyPt(
    target: TargetRef,
    power: number,
    toughness: number,
    duration: PtDuration,
  ): void;
  addCounter(target: TargetRef, counter: string, amount: number): void;
  grantKeyword(target: TargetRef, keyword: Keyword, duration: PtDuration): void;
  /** Create `count` copies of the named token, controlled by `ctx.controller`. */
  createToken(token: string, count: number): void;
  /** Attach `ctx.source` (an Aura/Equipment) to `target`. */
  attach(target: TargetRef): void;
}

export interface ResolutionContext extends EffectApi {
  readonly controller: PlayerId;
  readonly source: ObjectId;
  readonly targets: readonly TargetRef[];
}

/** Imperative escape hatch for a spell or ability the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

function resolveEffectTarget(
  ref: EffectTargetRef,
  ctx: ResolutionContext,
): TargetRef | undefined {
  if (ref === "source") return { kind: "object", object: ctx.source };
  return ctx.targets[ref];
}

export function applyEffectSpec(spec: EffectSpec, ctx: ResolutionContext): void {
  switch (spec.kind) {
    case "damage": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.dealDamage(target, spec.amount);
      return;
    }
    case "add-mana":
      ctx.addMana(ctx.controller, spec.mana, spec.amount);
      return;
    case "draw":
      ctx.draw(ctx.controller, spec.amount);
      return;
    case "gain-life":
      ctx.gainLife(ctx.controller, spec.amount);
      return;
    case "tap": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.tapPermanent(target);
      return;
    }
    case "untap": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.untapPermanent(target);
      return;
    }
    case "destroy": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.destroyPermanent(target);
      return;
    }
    case "modify-pt": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.modifyPt(target, spec.power, spec.toughness, spec.duration);
      }
      return;
    }
    case "add-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.addCounter(target, spec.counter, spec.amount);
      }
      return;
    }
    case "grant-keyword": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.grantKeyword(target, spec.keyword, spec.duration);
      }
      return;
    }
    case "create-token":
      ctx.createToken(spec.token, spec.count);
      return;
    case "attach": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.attach(target);
      return;
    }
    default:
      throw new Error(
        `unhandled effect kind: ${(spec as { kind: string }).kind}`,
      );
  }
}
