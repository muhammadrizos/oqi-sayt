# O'QI — sayt versiyasi

Bu papka — saytning o'zi. Ichida server kodi yo'q: faqat statik fayllar, ya'ni har qanday
bepul hostingga yuklash mumkin.

```
index.html            bosh sahifa (barcha ekranlar shu yerda)
assets/styles.css     dizayn
assets/data.js        katalog (16 kitob)
assets/texts.js       matnlar
assets/app.js         mantiq: qidiruv, o'quvchi, saqlash
manifest.webmanifest  telefonga "ilova sifatida o'rnatish" uchun
sw.js                 oflayn kesh (internet uzilsa ham ochiladi)
robots.txt            qidiruv tizimlari uchun
assets/oqi-wordmark.png   logotip (shaffof fon, qora)
assets/oqi-icon-*.png     ilova belgisi (sariq fon, 180/192/512)
assets/oqi-og.png         ijtimoiy tarmoq kartochkasi (1200×630)
favicon-32.png            yorliqdagi kichik belgi
```

## 1. Kompyuterda ko'rish

`index.html` ni ikki marta bosing — brauzerda ochiladi.
Yoki lokal server bilan (service worker va "o'rnatish" tugmasi to'liq ishlashi uchun):

```powershell
cd web
npx serve .
```

## 2. Internetga chiqarish — 3 yo'l

### A. Netlify Drop (eng tez, 2 daqiqa)
1. https://app.netlify.com/drop oching
2. `web` papkasini sudrab tashlang
3. Tayyor — havola beriladi (masalan `kitobxon.netlify.app`)
4. Keyin "Site settings → Domain" da o'z domeningizni ulashingiz mumkin

Ro'yxatdan o'tish bepul. Kartochka talab qilinmaydi.

### B. GitHub Pages (bepul, kod bilan birga)
```powershell
# GitHub da bo'sh repository yarating, so'ng:
cd web
git init
git add .
git commit -m "O'QI sayti"
git branch -M main
git remote add origin https://github.com/<login>/kitobxon.git
git push -u origin main
```
So'ng repository → **Settings → Pages** → Branch: `main`, papka: `/ (root)` → Save.
2-3 daqiqadan keyin `https://<login>.github.io/kitobxon/` da ochiladi.

### C. Cloudflare Pages yoki Vercel
Ikkisida ham "Framework: None / Static" tanlanadi, build buyrug'i bo'sh,
chiqish papkasi `.` (yoki `web`) — shu bilan tamom.

## 3. Domeningizni ulash

Domen sotib olgach (masalan `.uz` — uzinfocom orqali):
- Netlify: **Domain management → Add domain** → DNS da `CNAME` yozuvi
- Cloudflare: domenni to'g'ridan-to'g'ri Cloudflare'ga o'tkazing, `A`/`CNAME` avtomatik

HTTPS avtomatik yoqiladi. Bu muhim: `sw.js` va "ilova sifatida o'rnatish"
faqat HTTPS da ishlaydi.

## 4. Yangilash

Faylni o'zgartirib, hostingga qayta yuklang. Service worker eski keshni ko'rsa,
`sw.js` ichidagi `CACHE = "oqi-v1"` ni `v2` ga oshiring — foydalanuvchilar yangi
versiyani oladi.

## 5. Kitob qo'shish

`assets/data.js` ga yangi yozuv qo'shing, `assets/texts.js` ga matnini bering:

```js
{
  id: "yangi-kitob",
  title: "Kitob nomi",
  original: "Original nomi",
  author: "Muallif",
  authorFull: "Muallif (yil–yil)",
  year: 1900, genre: "roman", lang: "uz", pages: 300,
  desc: "Qisqa tavsif.",
  cover: { c1: "#f5c62b", c2: "#e0a516", ink: "#1b1710" },
  license: "public-domain",
  source: "Manba nomi va havolasi",
  added: 50, popularity: 70,
  textKind: "full"   // "full" | "sample" | "pending"
}
```

**Qoida:** huquqi tekshirilmagan matnni `full` qilib qo'ymang. Public domain yoki
yozma litsenziya bo'lishi shart.

## 6. Hozirgi holat

- 16 kitob katalogda
- 1 ta to'liq matn («Baxtli shahzoda», o'zbekcha tarjima)
- 3 ta namuna parcha
- 12 tasida «Matn kutilmoqda»

Ya'ni sayt ishlaydi, lekin kontent hali to'liq emas — bu keyingi bosqich.

## 7. Joylashtirish uchun tayyor fayllar

| Fayl | Nima qiladi |
|---|---|
| _headers | Netlify/Cloudflare uchun keshlash va xavfsizlik sarlavhalari |
| 404.html | Topilmagan sahifa uchun chiroyli xabar |
| .nojekyll | GitHub Pages ssets papkasini to'g'ri berishi uchun |
| obots.txt | Qidiruv tizimlariga ruxsat |
| sw.js | Oflayn ishlash (HTTPS shart) |

Subpapkada ham tekshirilgan: https://sayt.uz/oqi/ ko'rinishida joylashtirilsa,
barcha fayllar nisbiy yo'l bilan ochiladi.

Bitta eslatma: 404.html ichidagi havolalar ildizga (/) nisbatan yozilgan.
GitHub Pages'da loyiha subpapkasida (/oqi/) joylashtirsangiz, ulani
ssets/... va index.html ga o'zgartiring.
