# Kế hoạch cải thiện — Strive Edu (Mission Control)

> Tài liệu này đánh giá hiện trạng app và đề xuất lộ trình cải thiện theo **phase**,
> ưu tiên: (1) sửa đúng những gì đang sai, (2) mở đường cho backend, (3) nâng trải nghiệm.
> Mỗi task có: mục tiêu, việc cần làm, file ảnh hưởng, tiêu chí hoàn thành (acceptance).

## Quyết định đã chốt

| # | Quyết định | Ảnh hưởng tới plan |
|---|-----------|--------------------|
| Backend | **Supabase** (Postgres + Auth). Sau này migrate DB khác được vì đây là Postgres chuẩn — với điều kiện mọi truy cập đi qua 1 lớp adapter (`lib/store` + API), không rải SDK khắp UI | Phase 4 |
| Chart | **Có tooltip**. Giữ canvas tự vẽ, thêm lớp tooltip overlay (không dùng thư viện chart) để hợp hướng "ổn định" | Task 5.3 |
| Phạm vi | **Ổn định** — KHÔNG rewrite hết sang React. Chỉ làm: (a) cổng auth = React ở `page.js`, (b) tách data layer, (c) dashboard giữ legacy | Phase 3 rút gọn |
| Ngôn ngữ | **TypeScript cho code mới** (`lib/store.ts`, supabase client, types). Code legacy giữ JS — TS/JS chạy chung trong Next.js, không convert cục 1124 dòng | Phase 2, 3, 4 |

**Cơ chế dung hòa "ổn định" + "có backend"**: data layer TS (`lib/store.ts`) tách *"data ở đâu"*
khỏi *"UI viết kiểu gì"*. Legacy JS vẫn gọi `store.update()`; bên dưới store đồng bộ Supabase.
Cổng login là React bọc ngoài; chỉ khi đăng nhập xong mới mount dashboard legacy.

---

## 0. Hiện trạng (baseline)

- **Stack**: Next.js 15 (App Router) bọc lại một dashboard vanilla-JS 1 file.
- **Cách hoạt động**: `app/page.js` chèn markup gốc qua `dangerouslySetInnerHTML`
  (`BODY_HTML`) rồi chạy `initMissionControl()` — toàn bộ logic là thao tác DOM thủ công.
- **Lưu trữ**: `localStorage` (key `missionControl_pmp_pspo_v1`), không backend.
- **Tính năng**: Dashboard, Calendar, Resources, Mock Exam, Planner, Analytics, Error Log.

### Các vấn đề đã xác nhận (soi trực tiếp trong code)

| # | Vấn đề | Mức | Vị trí |
|---|--------|-----|--------|
| 1 | Kiến trúc DOM-thủ-công là ngõ cụt cho backend/auth | 🔴 | `app/page.js`, `init-mission-control.js` |
| 2 | Task không có `completedAt` → velocity/burn-up/KPI chỉ là ước lượng | 🔴 | `mkTask()`; comment dòng 273–274 |
| 3 | Không có versioning/migration cho schema localStorage | 🟠 | dòng 9, 42, 53 |
| 4 | Theme FOUC (nháy tối→sáng khi load) | 🟠 | `app/layout.js:10` |
| 5 | Thiếu favicon (404 console) | 🟡 | không có `public/` |
| 6 | `resize` re-render cả view, không debounce | 🟡 | dòng 1116 |
| 7 | Dùng `alert()/confirm()` (×5) | 🟡 | 5 chỗ |
| 8 | Accessibility: div làm nút, drag-drop không có phím, thiếu ARIA | 🟠 | `nav-item`, `task-check`, `draggable` |
| 9 | Chart canvas tự vẽ, không tooltip/hover | 🟡 | `drawLineChart/drawBarChart` |
| 10 | Không có test / eslint / CI | 🟡 | — |

---

## Phase 1 — Ổn định & Quick wins  *(0.5–1 ngày)*

Mục tiêu: dọn sạch lỗi hiển thị, không đụng kiến trúc. Có thể làm & deploy ngay.

### 1.1 Thêm favicon + metadata
- **Việc**: tạo `app/icon.svg` (hoặc `public/favicon.ico`); bổ sung `metadata.icons`
  và `themeColor` trong `app/layout.js`.
- **Acceptance**: không còn 404 `/favicon.ico`; tab trình duyệt có icon.

### 1.2 Sửa theme FOUC
- **Việc**: chèn một inline script chạy **trước paint** trong `<head>` (dùng
  `next/script` strategy `beforeInteractive` hoặc thẻ script thô trong layout) để đọc
  `localStorage` và set `data-theme` trên `<html>` ngay lập tức.
- **Acceptance**: user để theme sáng → load thẳng nền sáng, không nháy.

### 1.3 Debounce resize
- **Việc**: bọc handler `resize` (dòng 1116) bằng debounce ~150ms.
- **Acceptance**: kéo resize cửa sổ không giật; chart chỉ vẽ lại sau khi ngừng kéo.

### 1.4 Schema versioning + migration an toàn
- **Việc**: thêm `store.schemaVersion`; trong `loadStore()` viết hàm `migrate(store)`
  nâng cấp dần từng version. Nếu parse lỗi → backup key cũ (`..._backup_<ts>`) thay vì
  ghi đè mất data.
- **Acceptance**: đổi model không làm mất data cũ; có đường lùi.

### 1.5 Bật ESLint + format
- **Việc**: thêm `eslint-config-next`, script `lint`; (tuỳ chọn) Prettier.
- **Acceptance**: `npm run lint` chạy sạch.

---

## Phase 2 — Sửa đúng Data Model  *(1–2 ngày)*

Mục tiêu: để các số liệu (velocity, burn-up, streak, KPI) **đúng** thay vì ước lượng.
Đây là tiền đề cho cả Analytics tin cậy lẫn backend.

### 2.1 Tách "data layer" ra module độc lập  *(TypeScript)*
- **Việc**: tạo `lib/store.ts` (thuần TS, không phụ thuộc framework) gói toàn bộ
  đọc/ghi state + pub/sub (`subscribe/notify`) + định nghĩa `types` cho toàn bộ model
  (Task, StudyLog, MockExam, ErrorLog, Resource). Legacy code gọi qua module này thay vì
  thao tác biến `store` toàn cục.
- **Lý do**: đây là "trái tim" và là **lớp adapter** — sau này cùng module này sẽ nói
  chuyện với Supabase; đổi backend chỉ sửa ở đây.
- **Bật TS**: thêm `tsconfig.json` (Next.js tự tạo khi có file `.ts`); JS và TS chạy chung.
- **Acceptance**: mọi thay đổi state đi qua `store.update(...)`; UI legacy vẫn chạy như cũ;
  `npm run build` (có type-check) sạch.

### 2.2 Thêm `completedAt` cho task
- **Việc**: `mkTask()` thêm field `completedAt: null`; khi tick done → set timestamp,
  bỏ tick → clear. Migration (1.4) gán `completedAt` = ngày lịch cho task done cũ.
- **Acceptance**: task done lưu đúng mốc thời gian hoàn thành.

### 2.3 Tính lại analytics theo `completedAt`
- **Việc**: `weeklyVelocity()`, burn-up chart, KPI tuần dùng `completedAt` thật
  (bỏ phần "approximate" ở dòng 273–274). Streak vẫn dựa `studyLog` nhưng đồng bộ
  logic với task completion.
- **Acceptance**: hoàn thành 3 task hôm nay → velocity/KPI tuần phản ánh đúng ngay.

### 2.4 Validation input
- **Việc**: chặn điểm ngoài 0–100, ngày trống, số giờ âm; hiển thị lỗi inline thay vì
  cho phép dữ liệu rác vào store.
- **Acceptance**: nhập điểm 150 hoặc chữ → bị chặn, có thông báo.

---

## Phase 3 — Cổng Auth React (scope "ổn định")  *(1–2 ngày)*

> Theo quyết định "ổn định": **KHÔNG** migrate toàn bộ view sang React. Chỉ dựng lớp vỏ
> React cho auth; dashboard giữ nguyên legacy. (Việc migrate hết sang React để ở
> "Phase 3-mở-rộng" bên dưới, làm sau nếu cần.)

### 3.1 Cổng auth = React ở tầng `app/page.js`
- **Việc**: `page.js` kiểm tra session Supabase. Chưa đăng nhập → render màn hình Login
  (React). Đã đăng nhập → mới mount dashboard legacy (`BODY_HTML` + `initMissionControl`).
- **Acceptance**: chưa login không thấy dashboard; login xong dashboard chạy như cũ.

### 3.2 Kết nối legacy ↔ session
- **Việc**: truyền `user_id`/session xuống `lib/store.ts` để store biết đồng bộ data của ai.
- **Acceptance**: đổi tài khoản → dashboard nạp đúng data tài khoản đó.

---

### Phase 3-mở-rộng — Migrate hết sang React *(tuỳ chọn, làm sau)*

Chỉ làm khi muốn nâng cấp sâu (bỏ hẳn `dangerouslySetInnerHTML`). Kiểu Strangler Fig,
mỗi lần 1 view (thứ tự dễ→khó: Resources → Error Log → Planner → Mock Exam → Calendar →
Dashboard). **Hiện gác lại theo scope "ổn định".**

---

## Phase 4 — Backend & Đồng bộ đa thiết bị  *(3–5 ngày)*

Mục tiêu: data không còn kẹt trong 1 trình duyệt; đăng nhập, sync nhiều máy.
**Phụ thuộc Phase 2 (data layer) + Phase 3 (React).**

### 4.1 Hạ tầng: Supabase *(đã chốt)*
- **Việc**: tạo project Supabase; cài `@supabase/supabase-js`; tạo `lib/supabase.ts`
  (client) + biến môi trường `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (khai trong Vercel → Settings → Environment Variables).
- **Portability**: mọi query gói trong `lib/store.ts`/API — sau này rời Supabase chỉ sửa
  1 lớp adapter (đây là Postgres chuẩn nên export/import dễ).
- **Acceptance**: kết nối được Supabase từ local và từ bản deploy Vercel.

### 4.2 Auth
- **Việc**: đăng nhập (email/Google). View sau login mới thấy data của mình.
- **Acceptance**: 2 máy khác nhau, cùng tài khoản → thấy cùng data.

### 4.3 Schema DB + API
- **Việc**: bảng `tasks`, `study_logs`, `mock_exams`, `error_logs`, `resources`,
  `exam_dates` gắn `user_id`. API routes trong `app/api/*` (hoặc Server Actions).
- **Acceptance**: CRUD qua API, RLS chặn user đọc data người khác.

### 4.4 Sync + offline fallback
- **Việc**: `lib/store.js` đọc/ghi API; giữ localStorage làm cache offline; import
  data localStorage cũ lên tài khoản lần đầu đăng nhập.
- **Acceptance**: mất mạng vẫn dùng được (cache), có mạng lại thì đồng bộ; data cũ
  không mất khi lên tài khoản.

---

## Phase 5 — Nâng trải nghiệm (UX/A11y/Polish)  *(2–3 ngày, xen kẽ)*

Có thể làm song song sau Phase 3.

### 5.1 Accessibility
- Nút thật (`<button>`) thay cho div; ARIA cho nav/modal; focus trap trong modal;
  phím tắt thay thế cho drag-drop (nút "dời sang ngày…"); nav bằng bàn phím.
- **Acceptance**: điều hướng & thao tác chính hoàn toàn bằng bàn phím; qua kiểm tra
  axe DevTools không lỗi nghiêm trọng.

### 5.2 Thay `alert()/confirm()`
- Toast + modal xác nhận có style (5 chỗ hiện dùng alert/confirm).
- **Acceptance**: không còn popup trình duyệt mặc định.

### 5.3 Chart tương tác — tooltip overlay *(đã chốt: giữ canvas)*
- **Việc**: giữ canvas tự vẽ, thêm lớp tooltip: lắng `mousemove` trên canvas → map toạ độ
  chuột về điểm dữ liệu gần nhất → hiện 1 div nổi (giá trị + nhãn) + chấm highlight.
  Áp cho line chart (burn-up, xu hướng điểm) và bar chart (KPI/giờ tuần).
- **Không dùng thư viện chart** (giữ 0-dependency, hợp scope "ổn định").
- **Acceptance**: rê chuột vào chart thấy giá trị điểm; rời chuột tooltip ẩn.

### 5.4 Trạng thái rỗng/đang tải/lỗi
- Empty state đẹp hơn; skeleton khi tải data từ API (sau Phase 4); error boundary.
- **Acceptance**: mỗi màn hình có empty/loading/error rõ ràng.

### 5.5 PWA (tuỳ chọn)
- Manifest + service worker → cài như app, chạy offline.
- **Acceptance**: cài được lên màn hình chính, mở offline vẫn xem được.

---

## Phase 6 — Chất lượng & Vận hành  *(xuyên suốt)*

- **Test**: Vitest + React Testing Library cho `lib/store.js` và các component chính;
  vài E2E (Playwright) cho luồng quan trọng (tick task, thêm exam, đổi theme).
- **CI**: GitHub Actions chạy `lint + build + test` mỗi PR (Vercel lo deploy).
- **Acceptance**: PR đỏ khi test/lint/build fail.

---

## Thứ tự ưu tiên (theo scope "ổn định" đã chốt)

```
Phase 1 (quick wins) ──► Phase 2 (data layer TS + completedAt) ──► Phase 3 (cổng auth React) ──► Phase 4 (Supabase sync)
        │                                                                                              │
        └────────────────── Phase 5 (tooltip, a11y, bỏ alert) làm xen kẽ ─────────────────────────────┘
Phase 6 (test/CI) bật sớm, duy trì xuyên suốt
Phase 3-mở-rộng (migrate hết React): GÁC LẠI
```

**Làm ngay tuần này**: toàn bộ Phase 1 + task 2.1 (tách `lib/store.ts`) — vừa sửa lỗi
nhìn thấy được, vừa đặt nền adapter cho Supabase.

---

## Trạng thái quyết định: ĐÃ CHỐT

1. ✅ Backend = **Supabase** (migrate DB sau dễ vì là Postgres chuẩn, giữ sau lớp adapter).
2. ✅ Chart = **giữ canvas + thêm tooltip overlay** (không dùng thư viện).
3. ✅ Phạm vi = **ổn định** (cổng auth React + tách data layer; KHÔNG rewrite hết sang React).
4. ✅ **TypeScript** cho code mới; legacy giữ JS.
