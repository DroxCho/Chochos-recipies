# Chochos Recipes

Step 1 scaffold for a modular multi-page Recipes app.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase client

## Structure

- Header component
- Footer component
- Home page (currently empty)
- Route-based multi-page setup

## Supabase

Configured URL:

- `https://bpgfxnwlrrgntzhjxqdr.supabase.co`

Create a `.env` file based on `.env.example` and set both variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

For Netlify, set the same two names in Site settings -> Environment variables.

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run preview`
