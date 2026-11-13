# O'QI — Admin panel o'rnatish va ishlatish yo'riqnomasi

Bu yo'riqnoma saytingizga **brauzerdan tahrirlash paneli** qo'shadi:
`https://oqi-sayt.onrender.com/admin/` manzilidan kirasiz, kitoblarni va
matnlarni tahrirlaysiz, **Save** bosasiz → o'zgarish GitHub'ga commit
bo'ladi → **Render 1–2 daqiqada saytni avtomatik yangilaydi**.

Tahrirlash tizimi — **Decap CMS** (ochiq kodli, bepul). Sizning repoga:
`admin/index.html` va `admin/config.yml` qo'shildi, ma'lumot fayllari
CMS-ga moslandi.

---

## 1. Bir martalik sozlash (≈10 daqiqa)

### 1.1. DecapBridge'da saytni ro'yxatdan o'tkazing

Decap CMS GitHub bilan ishlashi uchun OAuth vositachi kerak. Eng osoni —
bepul **DecapBridge** xizmati:

1. https://decapbridge.com → **Sign in with GitHub** (GitHub hisobingiz bilan kiring)
2. **Add Site** (yoki "Create site") tugmasini bosing
3. Git provider sifatida **GitHub** ni, repo sifatida `muhammadrizos/oqi-sayt` ni tanlang.
4. **Github access token** maydoniga ushbu repo bilan cheklangan fine-grained token kiriting.
   Tokenni faqat DecapBridge formasiga kiriting; chatga yubormang yoki skrinshotda ko'rsatmang.
   Token uchun `Contents: Read and write` va `Pull requests: Read and write` ruxsatlari
   kerak; boshqa repolarga ruxsat bermang va imkon bo'lsa amal muddatini cheklang.
5. **Decap CMS login URL** ga
   `https://oqi-sayt.onrender.com/admin/index.html` ni kiriting.
6. **Auth type** sifatida **PKCE** ni tanlang. Admin sahifa Decap CMS 3.8.3+ ni yuklaydi.
7. Qolgan maydonlarni to'ldirib saytni yarating. DecapBridge ko'rsatgan tayyor
   `backend:` sozlamalaridan `base_url` va `auth_endpoint` qatorlarini nusxalang.

### 1.2. config.yml ni yangilang

`admin/config.yml` faylida `backend:` bloki ichidagi ikki qatorni
DecapBridge bergan qiymat bilan almashtiring:

```yaml
backend:
  name: github
  repo: muhammadrizos/oqi-sayt
  branch: main
  base_url: https://auth.decapbridge.com/sites/SIZNING-SITE-ID   # <- DecapBridge'dan
  auth_endpoint: /auth                                           # <- DecapBridge'dan
```

### 1.3. Fayllarni GitHub'ga yuklang

Quyidagi fayllar o'zgardi/yangi. Ularning hammasi bu papkada tayyor:

| Fayl | Holati |
|---|---|
| `admin/index.html` | **YANGI** — admin panel sahifasi |
| `admin/config.yml` | **YANGI** — panel sozlamasi (1.2 dagi 2 qatorni to'ldiring!) |
| `data/books.json` | O'ZGARDI — endi `{"books": [...]}` shaklida |
| `data/texts/*.md` | **YANGI** — 5 ta kitob matni markdown faylda |
| `assets/app.js` | O'ZGARDI — matnlar .md dan yuklanadi |
| `assets/texts.js` | O'ZGARDI — bo'sh (matnlar endi .md da) |
| `sw.js` | O'ZGARDI — kesh versiyasi v9 |
| `index.html` | O'ZGARDI — eski matn scripti olib tashlandi |
| `.pages.yml`, `data/texts/gulliverning-sayohatlari.js` | **O'CHIRILDI** |

**GitHub orqali yuklash (git bilmasangiz):**
1. https://github.com/muhammadrizos/oqi-sayt → **Add file → Upload files**
2. Bu papkadan barcha o'zgargan fayllarni sudrab tashlang
   (`admin` papkasini ham, `data` papkasini ham — ichidagilari bilan)
3. O'chirilishi kerak fayllarni (.pages.yml va data/texts/gulliverning-sayohatlari.js)
   fayl ochib `This file was deleted` holatiga keltiring yoki
   fayl sahifasidagi 🗑 tugma bilan o'chiring
4. Pastda **Commit changes** → commit to `main`

**Git bilan (qulayroq):**

```bash
git clone https://github.com/muhammadrizos/oqi-sayt.git
cp -r oqi-sayt-admin/* oqi-sayt/
cd oqi-sayt
git add -A && git commit -m "Admin panel qo'shildi (Decap CMS)" && git push
```

### 1.4. Deploy kutib, kirib ko'ring

Render commitni ko'rib, 1–2 daqiqada qayta joylaydi. So'ng:
**https://oqi-sayt.onrender.com/admin/** → **Login with GitHub** →
DecapBridge orqali ruxsat bering → panel ochiladi.

> Agar `/admin/` "sahifa topilmadi" desa: Render Dashboard → saytingiz →
> **Redirect Rules** → qo'shing: Source `/admin` → Destination
> `/admin/index.html` (Rewrite, 200). Keyin yana urinib ko'ring.

---

## 2. Panel bilan ishlash

Panelda ikki bo'lim bor:

### 📖 Kitoblar katalogi

`data/books.json` fayli — saytdagi barcha 17 kitob ro'yxati. Har bir
kitobda: nomi, muallif, yil, janr, til, sahifalar soni, tavsif, muqova
ranglari, huquq holati, ommaboplik va **matn holati** (`full` / `sample` /
`pending`).

- **Yangi kitob qo'shish:** ro'yxat pastidagi **Add** tugmasi → maydonlarni
  to'ldiring → Save.
- `textKind: pending` bo'lsa saytda "Matn kutilmoqda" chiqadi va o'qish
  tugmasi o'chirilgan bo'ladi.
- `textKind: full` yoki `sample` bo'lsa, **matn fayli ham kerak** (pastga qarang).

### 📚 Kitob matnlari

`data/texts/` papkasidagi `.md` fayllar — kitoblarning o'zi. Har bir
faylda: `id` (katalogdagi kitob ID si bilan bir xil!), sarlavha va matn.

**Matn yozish tartibi (muhim):**

```markdown
---
id: gamlet
title: Gamlet
---
## 1-bob

Bu yerda birinchi bobning birinchi paragrafi turadi.

Ikkinchi paragraf shu yerda davom etadi.

## 2-bob

Keyingi bob matni...
```

- Har bir **bob** `## Bob nomi` qatori bilan boshlanadi
- Paragraflar orasiga **bo'sh qator** qo'yiladi
- Fayl nomi avtomatik `id` dan hosil bo'ladi: `data/texts/gamlet.md`

### Yangi kitobni to'liq qo'shish oqimi

1. **Kitoblar katalogi** → Add → ID masalan `sherlok` → maydonlarni to'ldiring
   → `textKind: full` → **Save**
2. **Kitob matnlari** → Add → ID yana `sherlok` → matnni `## Bob` lar bilan
   yozing → **Save**
3. Save bosilganda Decap o'zi GitHub'ga commit qiladi → Render qayta
   joylaydi → 1–2 daqiqada saytda kitob paydo bo'ladi

---

## 3. Muhim qoidalar va eslatmalar

- **Huquq:** repodagi qoidaga ko'ra faqat public domain yoki aniq
  litsenziyali asarlar kiritiladi. `license: checking` bo'lsa `textKind`
  ni `full` qilmang.
- **ID lar mos bo'lsin:** katalogdagi `id` va matn faylidagi `id` bir xil
  bo'lsa, kitob o'qishga ochiladi; mos kelmasa "matn hali qo'shilmagan"
  chiqadi.
- **Kesh:** sayt oflayn kesh ishlatadi — saytda o'zgarish ko'rinmasa
  **Ctrl+F5** bosing (kesh versiyasi `sw.js` da `oqi-v9`).
- **File:// rejimi:** `index.html` ni ikki marta bosib ochganda (server
  siz) matnlar yuklanmaydi — bu ilgari ham to'liq ishlamas edi. Sinash
  uchun lokal server: `npx serve .`
- **Kim tahrirlay oladi:** panelga kira olgan har kim repoga yozish huquqi
  bilan commit qiladi. DecapBridge'da hamkorlarni (collaborators) boshqarishingiz mumkin.
- **Eski Pages CMS:** `.pages.yml` olib tashlandi — endi bitta tizim
  (Decap CMS) ishlaydi. Xohlasangiz git tarixidan qaytarsangiz bo'ladi.
- **Zaxira:** har bir Save — GitHub'da alohida commit, xato qilsangiz
  repodan **Revert** qilish mumkin.

---

## 4. Muammolar bo'lsa

| Muammo | Yechim |
|---|---|
| `/admin/` topilmadi (404) | 1.4 dagi Redirect Rule ni qo'shing; manzil oxirida `/` bo'lsin |
| Login ishlamaydi | DecapBridge'dan `base_url` va `auth_endpoint` qatorlarini aynan ko'chirganingizni, Auth type va CMS login URL to'g'ri ekanini tekshiring |
| Panelda "repo not found" yoki save xatosi | Token faqat `muhammadrizos/oqi-sayt` reposiga tegishli ekanini, Contents va Pull requests uchun Read and write ruxsatlari borligini tekshiring |
| Saytda yangi kitob ko'rinmaydi | Render deploy holatini tekshiring + Ctrl+F5; `textKind` va matn fayli `id` mosligini tekshiring |
| Matn ochilmaydi, toast chiqadi | `data/texts/<id>.md` mavjudligini va `id` mosligini tekshiring |
