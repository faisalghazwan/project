# reps

a small workout logger. log sets at the gym, see what's improving.

## dev

```
pnpm install
pnpm dev
```

then http://localhost:3000

## build

```
pnpm build
```

outputs a static site to `out/`. data lives in localStorage.

for github pages under a project path, set the base path:

```
NEXT_PUBLIC_BASE_PATH=/reps pnpm build
```

## stack

next 16, react 19, tailwind v4, recharts.
