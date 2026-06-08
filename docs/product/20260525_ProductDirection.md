[Initial Created: 2026-05-25]
[Last Modified: 2026-05-25]

# momso Product Direction Baseline

## Current Decision

momso is the umbrella SaaS product. The repository, GitHub project, Vercel project, and Supabase project should all be treated as the momso foundation.

The 3D anatomy application is no longer the center of the momso MVP. It is deferred as a future sister product under the working name Body Note. Existing anatomy, timeline, layer, annotation, and mention work remains useful as a parked prototype, but it should not define the near-term momso product direction.

## Product Map

- `momso`: active SaaS umbrella and current repository identity.
- `Body Note`: future sister product, working name, focused on 3D anatomy/education tooling.
- Current web app: cloud-core foundation plus a parked Body Note prototype surface.

## Near-Term Setup Rules

- Keep auth, database, deployment, workspace persistence, and project naming aligned with momso.
- Do not treat the old 3D anatomy PRD as the active momso MVP.
- Do not delete the 3D prototype yet. Preserve it as a working sandbox until the new momso product brief is defined.
- When adding new features, prefer neutral momso naming such as workspace, project, notes, records, flows, and cloud core.
- Use Body Note naming only when referring to the deferred 3D anatomy sister product.

## Existing Documents

- `docs/product/legacy-body-note/20260325_PRD.md` is now legacy Body Note planning material.
- `docs/product/legacy-body-note/20260325_DesignGuide.md` is now legacy Body Note visual planning material.
- `docs/development/20260325_Infrastructure.md` remains active for infrastructure setup.
- `docs/development/20260325_WebAppGuide.md` remains active only for running the current prototype app.

## Next Inputs Needed

The next planning pass should define:

- the first momso customer/user segment
- the core job-to-be-done
- the first paid workflow
- what data momso stores
- what the app should show on the first screen before Body Note exists
