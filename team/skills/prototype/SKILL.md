---
name: prototype
label: 快速原型验证
icon: "https://lf3-static.bytednsdoc.com/obj/eden-cn/evithyeh7vibfuhpe/doubao_skill_icon_528/prototype.png"
description: "在正式投入设计前构建一次性原型以验证方案。根据问题在两个分支间路由：用于状态或业务逻辑验证的可运行终端应用，或在同一路由下切换的多套差异明显的 UI 方案。当用户希望制作原型、快速验证数据模型或状态机、搭建 UI 草模、探索设计选项，或提出“做个原型”“让我试用”“尝试几种设计”时使用。"
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast and then delete it.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** When the prototype has answered its question, either delete it or fold the validated decision into the real code — don't leave it rotting in the repo.
7. **Name the environment and status precisely.** Label the artifact as a local prototype, static demo, test deployment, or production deployment based on actual evidence. A reachable URL does not by itself prove production readiness, authentication, persistence, performance, or compliance.
8. **Keep facts separate from demo assumptions.** Mark Mock data, sample users, weights, thresholds, forecasts, testimonials, and conversion claims as unvalidated examples unless the user supplied a verifiable source. Never invent validation counts, success logs, or metric lifts.
9. **Gate high-risk decisions.** For employment, medical, legal, financial, investment, or other consequential decisions, build only decision-support and audit flows. Do not output or automate the final decision; require an accountable human and applicable professional review.
10. **Gate external effects.** Before production deployment, real account creation, database writes, notifications, payments, or other irreversible actions, state the target, scope, required permissions, rollback, and verification plan, then obtain explicit authorization.

## When done

The _answer_ is the only thing worth keeping from a prototype. Capture it somewhere durable (commit message, ADR, issue, or a `NOTES.md` next to the prototype) along with the question it was answering. Record the actual run command, observed evidence, environment, remaining assumptions, and unverified scope. If the user is around, that capture is a quick conversation; if not, leave the placeholder so they (or you, on the next pass) can fill in the verdict before deleting the prototype.
