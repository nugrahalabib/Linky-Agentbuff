# Login dengan Google — Panduan Setup Lengkap

Linky sekarang **login pakai Google saja** (OAuth 2.0 + PKCE, tanpa kata sandi). Kode-nya sudah jadi; kamu cuma perlu membuat **OAuth Client ID + Secret** di Google Cloud Console lalu menempelkannya ke env. Ada juga "colokan" SSO/OIDC generik untuk IdP enterprise (bagian akhir).

> TL;DR env yang dibutuhkan:
> ```
> GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
> GOOGLE_CLIENT_SECRET=xxxx
> NEXT_PUBLIC_APP_URL=https://linky.agentbuff.id   # atau http://localhost:1709 saat dev
> ```
> Redirect URI yang harus didaftarkan di Google:
> `${NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`

---

## 1. Buat / pilih project di Google Cloud
1. Buka <https://console.cloud.google.com/>.
2. Klik dropdown project (kiri atas) → **New Project** → nama mis. `Linky` → **Create**.
3. Pastikan project itu yang aktif.

## 2. Konfigurasi OAuth consent screen
1. Menu kiri → **APIs & Services → OAuth consent screen**.
2. **User Type**: pilih **External** → **Create**.
3. Isi:
   - **App name**: `Linky`
   - **User support email**: email kamu (`agentbuff.id@gmail.com`)
   - **App logo** (opsional): logo Linky
   - **Application home page**: `https://linky.agentbuff.id`
   - **Authorized domains**: `agentbuff.id`
   - **Developer contact**: email kamu
4. **Scopes**: klik **Add or remove scopes** → centang `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` → **Update** → **Save and Continue**.
5. **Test users** (selama app masih "Testing"): tambahkan email-email yang boleh login dulu (mis. email kamu). Saat siap publik, klik **Publish app** agar siapa pun bisa login.
6. **Save and Continue** sampai selesai.

## 3. Buat OAuth Client ID
1. Menu kiri → **APIs & Services → Credentials**.
2. **+ Create Credentials → OAuth client ID**.
3. **Application type**: **Web application**.
4. **Name**: `Linky Web`.
5. **Authorized JavaScript origins** — tambahkan:
   - `http://localhost:1709` (dev)
   - `https://linky.agentbuff.id` (prod)
6. **Authorized redirect URIs** — tambahkan **persis** (ini yang paling sering salah):
   - `http://localhost:1709/api/auth/oauth/google/callback` (dev)
   - `https://linky.agentbuff.id/api/auth/oauth/google/callback` (prod)
7. **Create**. Muncul **Client ID** dan **Client secret** — salin keduanya.

> ⚠️ Redirect URI harus sama persis (skema, host, port, path, tanpa trailing slash). Path-nya selalu `/api/auth/oauth/google/callback`.

## 4. Tempel ke environment
**Dev** (`.env.local`):
```bash
NEXT_PUBLIC_APP_URL=http://localhost:1709
AUTH_SECRET=dev-secret-linky-local-only-32-characters-minimum-ok
GOOGLE_CLIENT_ID=PASTE_CLIENT_ID
GOOGLE_CLIENT_SECRET=PASTE_CLIENT_SECRET
```
**Prod** (`.env.production` di VPS, mode 600):
```bash
NEXT_PUBLIC_APP_URL=https://linky.agentbuff.id
AUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=PASTE_CLIENT_ID
GOOGLE_CLIENT_SECRET=PASTE_CLIENT_SECRET
```
Restart server setelah set env (`npm run dev` / restart container).

## 5. Tes
1. Buka `http://localhost:1709/signin` → tombol **"Lanjutkan dengan Google"** muncul.
2. Klik → pilih akun Google → diarahkan balik ke `/dashboard`, akun otomatis dibuat.
3. Kalau tombolnya tidak muncul: berarti `GOOGLE_CLIENT_ID`/`SECRET` belum ke-load (cek env + restart).

---

## Cara kerja (ringkas, untuk developer)
- `GET /api/auth/oauth/google/start` → generate `state` + PKCE `code_verifier` (disimpan di cookie httpOnly 10 menit) → redirect ke Google.
- `GET /api/auth/oauth/google/callback` → validasi `state`, tukar `code` → `access_token` (pakai `code_verifier`), ambil profil dari userinfo, `findOrCreateOAuthUser`, buat sesi (`linky_session` JWT), redirect ke `/dashboard`.
- User dicocokkan urut: `(provider, subject)` → `email` (link akun lama) → buat baru.
- Sesi tetap pakai infra lama (JWT HS256 + tabel `sessions`), jadi revoke/30-hari expiry tetap jalan. Kode di `src/lib/oauth.ts` + `src/lib/auth.ts` (`findOrCreateOAuthUser`).

## Error codes di `/signin?error=...`
| code | arti |
|---|---|
| `provider_unavailable` | env Client ID/Secret belum diset |
| `oauth_denied` | user batal di layar Google |
| `oauth_state` | state/PKCE tidak cocok atau cookie kedaluwarsa |
| `oauth_failed` | gagal tukar code / ambil profil |
| `no_email` | akun Google tidak memberi email |

---

## Colokan SSO (OIDC generik) — untuk nanti
Sudah disiapkan provider OIDC generik yang **otomatis aktif** kalau env-nya diisi (tanpa ubah kode). Cocok untuk Keycloak, Auth0, Azure AD, Okta, dsb.

```bash
SSO_OIDC_LABEL=Perusahaan                # teks tombol: "Lanjutkan dengan Perusahaan"
SSO_OIDC_AUTHORIZE_URL=https://idp.example.com/authorize
SSO_OIDC_TOKEN_URL=https://idp.example.com/token
SSO_OIDC_USERINFO_URL=https://idp.example.com/userinfo
SSO_OIDC_CLIENT_ID=xxx
SSO_OIDC_CLIENT_SECRET=xxx
SSO_OIDC_SCOPE=openid email profile      # opsional
```
Redirect URI yang didaftarkan di IdP: `${NEXT_PUBLIC_APP_URL}/api/auth/oauth/sso/callback`.

Mau tambah provider first-class lain (GitHub/Microsoft) dengan ikon sendiri? Tambah satu builder di `src/lib/oauth.ts` + cabang di `getProvider()`/`listConfiguredProviders()`. Routing `start`/`callback` sudah generik per-provider, jadi tidak perlu route baru.
