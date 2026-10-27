# Tight Ship

One hub for running a tight ship at home and at work. Built with Expo (React Native +
TypeScript, runs on iOS, Android and web) and Supabase (login + database).

## Modules (so far)

- **Service**: vehicles, machines and equipment. Recurring services by hours/miles, days, or
  both (whichever comes first), hours updates, and service history.
- **Home and rentals**: your own home plus rental properties. Tenant info, rent, recurring
  maintenance, history and spend.
- **Hub**: one "Needs attention" list across every module.

Planned: Finances (1099 / W-2 side income, expenses, mileage, quarterly tax set-aside),
CRM and jobs for trades, calendar, marketing.

## Structure

```
app/
  _layout.tsx          Root layout + auth gate
  login.tsx            Sign in / create account
  index.tsx            Hub
  service/new.tsx      Add equipment
  service/[id].tsx     Equipment detail, services, history
  properties/new.tsx   Add property
  properties/[id].tsx  Property detail, tasks, history
src/
  supabase.ts          Supabase client
  auth.tsx             Session + sign in/out
  store.tsx            Data loading + actions (all modules)
  maintenance.ts       Due logic shared by all modules
  types.ts, theme.ts
  components/          Tile, DueRow, ui (Button, Field)
```

New modules add their own screens under `app/<module>/`, their own tables, and a section on
the hub. Every table has `owner_id` and Row Level Security so users only see their own data.

## Database

Supabase project `aedkyctvcplftzwwimif`. Tables: `profiles`, `assets`, `service_tasks`,
`service_logs`, `properties`, `maintenance_tasks`, `maintenance_logs`.

## Run it

1. Install Node.js LTS and the **Expo Go** app on your phone (same Wi-Fi as your computer).
2. Copy `.env.example` to `.env` and paste your Supabase **publishable** key
   (Supabase dashboard > Connect). Never use the secret / service_role key in the app.
3. Run:
   ```
   npm run setup
   npm start
   ```
4. Scan the QR code with Expo Go. For the web version, run `npm run web`.

## Getting updates

Clone this repo with GitHub Desktop. When changes are pushed, open the repo in GitHub Desktop
and click **Fetch origin**, then **Pull origin**. With `npm start` running, the app on your
phone reloads by itself. If `package.json` changed, run `npm install` in the terminal once.
Your `.env` file stays on your computer and is never uploaded.
