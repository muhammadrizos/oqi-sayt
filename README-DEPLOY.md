# O'QI — sayt versiyasi

Bu papka — saytning o'zi. Server kodi yo'q: faqat statik fayllar, ya'ni har qanday
bepul hostingga yuklash mumkin (Render, Netlify, GitHub Pages, Cloudflare Pages).

## Tuzilma

```
index.html            barcha ekranlar (bosh sahifa, katalog, kitob, o'quvchi, sozlamalar)
assets/styles.css     dizayn: ranglar, tipografika, animatsiyalar
assets/app.js         mantiq: qidiruv, o'quvchi, saqlash
assets/data.js        zaxira katalog (faqat file:// rejimi uchun)
data/books.json       ASOSIY katalog — Pages CMS shu faylni tahrirlaydi
assets/texts.js       kitob matnlari
assets/oqi-*.png      logotip, ikonkalar, OG rasm
manifest.json         telefonga "ilova sifatida o'rnatish"
sw.js                 oflayn kesh
.pages.yml            Pages CMS sozlamasi
404.html              topilmagan sahifa
_headers              Netlify uchun keshlash sarlavhalari (Render o'qimaydi)
robots.txt            qidiruv tizimlari uchun
```

## 1. Kompyuterda ko'rish

`index.html` ni ikki marta bosing — brauzerda ochiladi.
To'liq rejim (service worker, JSON katalog) uchun lokal server kerak:

```powershell
cd web
npx serve .
```

## 2. Joylashtirish

**Render** (hozirgi asosiy): yangi Static Site → reponi ulang → branch `main`,
publish directory `.` → har commit'da avtomatik deploy.

**Netlify Drop**: https://app.netlify.com/drop → papkani sudrab tashlang.

**GitHub Pages**: Settings → Pages → branch `main`, papka `/ (root)`.

## 3. Kitoblarni brauzerdan tahrirlash (Pages CMS)

1. https://app.pagescms.org → **Sign in with GitHub**
2. Repozitoriyni tanlang (`muhammadrizos/oqi.uz` yoki sizning repongiz)
3. Chap menyuda **Kitoblar** → kitobni oching yoki **Add** bilan yangisini qo'shing
4. **Save** → o'zgarish repoga commit bo'ladi → Render 1–2 daqiqada qayta joylaydi

Maydonlar `.pages.yml` da belgilangan: nomi, muallif, janr, til, sahifalar, tavsif,
muqova ranglari, huquq holati, matn holati.

**Muhim:**
- `id` har bir kitobda unikal bo'lsin (lotin harflar va chiziqcha)
- `data/books.json` — asosiy manba; `assets/data.js` faqat file:// uchun zaxira
- `assets/texts.js` (kitob matnlari) hozircha qo'lda tahrirlanadi

## 4. Domen ulash

**Render**: Settings → Custom Domains → domenni qo'shing, keyin DNS'da:

| Tur | Nom | Qiymat |
|---|---|---|
| A | `@` | Render ko'rsatadigan IP |
| CNAME | `www` | `<sayt>.onrender.com` |

**GitHub Pages** uchun:

| Tur | Nom | Qiymat |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<login>.github.io` |

HTTPS avtomatik yoqiladi. Domen ulangach `index.html` dagi `canonical` va
`og:url` ni yangilash kerak.

## 5. Yangilash tartibi

1. `sw.js` ichidagi `CACHE` qiymatini oshiring (`oqi-v4` → `oqi-v5`)
2. Fayllarni commit qiling
3. Hosting o'zi qayta joylaydi; brauzerda Ctrl+F5

## 6. Ma'lumot modeli

```js
{
  id, title, original, author, authorFull, year,
  genre, lang, pages, desc,
  cover: { c1, c2, ink },
  license, source, added, popularity,
  textKind: "full" | "sample" | "pending"
}
```

**Qoida:** huquqi tekshirilmagan matnni `full` qilib qo'ymang — public domain yoki
yozma litsenziya bo'lishi shart.

## 7. Hozirgi holat

- 16 kitob katalogda
- 1 ta to'liq matn («Baxtli shahzoda», o'zbekcha tarjima)
- 3 ta namuna parcha
- 12 tasida «Matn kutilmoqda»

Sayt texnik jihatdan tayyor; asosiy ish — kontentni ko'paytirish.
