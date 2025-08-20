# 🚀 LFA Legacy GO - Tesztelési Rendszer

## Gyors használat

```bash
# Egyszerű deployment teszt
npm run test:quick

# Csak backend API teszt
npm run test:api

# Minden teszt
npm run test:all
```

## VSCode integráció

- `Ctrl+Shift+P` → "Tasks: Run Task" → "⚡ LFA Legacy GO - Gyors Teszt"

## Eredmény értelmezése

✅ **3/3 teszt sikeres** = Minden működik  
⚠️ **Kevesebb sikeres** = Ellenőrizd a deployment-et

## process.env kérdés

A böngésző console-ban **NORMÁLIS**, hogy `process.env.REACT_APP_API_URL` hibát ad!
Ez azért van, mert a `process` objektum csak Node.js-ben létezik.

A React build automatikusan beépíti az environment variable-öket, 
ezért a deployed app helyesen működik.