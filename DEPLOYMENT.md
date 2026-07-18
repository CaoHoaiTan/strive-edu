# Hướng dẫn Deploy lên Vercel

Project này là ứng dụng Next.js (App Router), không có backend/database — Vercel tự động nhận diện và build mà không cần cấu hình thêm.

## 1. Chuẩn bị

- Đã có tài khoản GitHub và repo `CaoHoaiTan/strive-edu` (đã push code lên `main`).
- Tạo tài khoản Vercel tại https://vercel.com/signup — nên đăng nhập bằng **GitHub** để dễ liên kết repo.

## 2. Cách 1 — Deploy qua Web UI (khuyến nghị cho lần đầu)

1. Vào https://vercel.com/new
2. Chọn **Import Git Repository**, chọn repo `strive-edu`.
   - Nếu chưa thấy repo, bấm **Adjust GitHub App Permissions** và cấp quyền cho Vercel truy cập repo đó.
3. Ở màn hình cấu hình project:
   - **Framework Preset**: Next.js (Vercel tự nhận diện).
   - **Root Directory**: để mặc định (`.`) vì `package.json` nằm ở gốc repo.
   - **Build Command**: `next build` (mặc định, không cần đổi).
   - **Output Directory**: để mặc định (Next.js tự quản lý).
   - **Install Command**: `npm install` (mặc định).
4. Phần **Environment Variables**: thêm các biến Supabase/Auth:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase, ví dụ `https://xxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key của project Supabase
   - `NEXT_PUBLIC_SITE_URL`: URL production của app, ví dụ `https://strive-edu-xxxx.vercel.app` hoặc custom domain
5. Bấm **Deploy**. Vercel sẽ build và cấp cho bạn 1 URL dạng `https://strive-edu-xxxx.vercel.app`.

Sau khi có URL production, vào Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: đặt đúng URL production của app.
- **Redirect URLs**: thêm URL production, ví dụ `https://strive-edu-xxxx.vercel.app`, và chỉ giữ `http://localhost:3000` nếu còn cần test local.

Nếu email magic link vẫn có `redirect_to=http://localhost:3000`, nguyên nhân thường là app đang chạy local hoặc deployment chưa có `NEXT_PUBLIC_SITE_URL` tại thời điểm build. Sau khi sửa biến môi trường trên Vercel, redeploy lại production.

Từ lần deploy này trở đi, **mỗi lần push code lên nhánh `main`, Vercel tự động build và deploy lại** (CI/CD có sẵn, không cần làm gì thêm). Các PR/nhánh khác sẽ có Preview Deployment riêng.

## 3. Cách 2 — Deploy qua Vercel CLI

Dùng khi muốn deploy thủ công từ máy local mà không qua GitHub.

```bash
# Cài & đăng nhập (chỉ cần làm 1 lần, sẽ mở trình duyệt để login)
npx vercel login

# Link thư mục project với 1 Vercel project (chạy trong thư mục strive-edu)
npx vercel link

# Deploy bản preview (test thử, ra URL riêng)
npx vercel

# Deploy bản production (ghi đè domain chính)
npx vercel --prod
```

Lệnh `vercel link` sẽ tạo thư mục `.vercel/` chứa cấu hình liên kết project — thư mục này đã được thêm vào `.gitignore`, không commit lên git.

## 4. Custom Domain (tuỳ chọn)

1. Vào project trên Vercel Dashboard → tab **Settings → Domains**.
2. Nhập domain của bạn (vd: `strive.edu.vn`) → Add.
3. Vercel sẽ hiển thị bản ghi DNS cần thêm:
   - Domain gốc (apex, vd `strive.edu.vn`): thêm bản ghi **A** trỏ về `76.76.21.21`.
   - Subdomain (vd `app.strive.edu.vn`): thêm bản ghi **CNAME** trỏ về `cname.vercel-dns.com`.
4. Vào trang quản lý DNS của nhà cung cấp domain, thêm bản ghi tương ứng.
5. Đợi DNS propagate (thường vài phút đến vài giờ) — Vercel tự động cấp SSL (Let's Encrypt) sau khi domain trỏ đúng.

## 5. Kiểm tra sau khi deploy

- Mở URL Vercel cấp, kiểm tra trang load đúng giao diện Mission Control.
- Mở DevTools Console — không có lỗi đỏ.
- Thử tick task, đổi theme, thêm resource... rồi reload trang — dữ liệu vẫn còn (lưu trong `localStorage` của trình duyệt, theo domain).

## 6. Rollback nếu deploy lỗi

Vào tab **Deployments** trên Vercel Dashboard, tìm deployment production trước đó còn hoạt động tốt → bấm nút **⋯ → Promote to Production** để rollback tức thì, không cần revert code.

## 7. Cấu trúc project liên quan đến build

```
strive-edu/
├── app/
│   ├── layout.js              # Root layout, import globals.css
│   ├── page.js                # Client component chính (render dashboard)
│   ├── globals.css            # Toàn bộ style
│   └── legacy/
│       ├── body-markup.js     # HTML markup gốc (dạng chuỗi)
│       └── init-mission-control.js  # Logic JS gốc (state, chart, calendar...)
├── next.config.mjs
├── package.json
└── package-lock.json
```

Không có bước build đặc biệt nào ngoài `next build` mặc định — Vercel tự chạy đúng lệnh này.
