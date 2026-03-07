---
description: Development workflow for namoland project
---
// turbo-all

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev -- -p 3002`
3. Generate Prisma client: `npx prisma generate`
4. Run database migration: `npx prisma migrate dev`
5. Seed database: `npx prisma db seed`
6. Build for production: `npm run build`
7. Run linter: `npm run lint`
