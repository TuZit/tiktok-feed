# TikTok Feed Design Explanation

## 1. Mục tiêu thiết kế

Project này được thiết kế như một side project phỏng vấn với ưu tiên:

- Trải nghiệm feed dọc giống TikTok trên mobile web
- Tối ưu hiệu năng có chủ đích (không chỉ chạy được)
- Kiến trúc đủ rõ để giải thích trong interview

Phạm vi chủ động giữ nhỏ:

- Không làm backend thật
- Không làm auth/profile/upload
- Tập trung `feed core + playback + interaction + benchmark`

## 2. Kiến trúc tổng thể

### App Shell

- `src/App.tsx` là màn hình feed fullscreen duy nhất
- Container dùng `scroll-snap` để mô phỏng cảm giác vuốt từng video
- UI gồm:
  - video layer
  - action overlay (like/comment/save/share)
  - metadata (author/description)
  - comments bottom sheet (mock)

### State và domain

- `src/store/feedReducer.ts` quản lý state trung tâm:
  - danh sách `items`
  - `cursor`, `hasMore`, `loading`, `error`
  - `activeId` (item đang active)
  - `viewerById` (liked/saved per item)
- Reducer xử lý luôn optimistic interaction và rollback snapshot

### Data layer

- `src/lib/mockApi.ts` cung cấp contract mock:
  - `getFeed({ cursor, limit })`
  - `postInteraction({ itemId, actionType })`
- `src/lib/feedNormalizer.ts` chuẩn hóa dữ liệu để tránh số âm/invalid

### Playback layer

- `src/lib/playbackController.ts` tách riêng khỏi UI để giữ logic phát video độc lập
- API chính:
  - `registerItem(id, videoEl)`
  - `unregisterItem(id)`
  - `setActiveItem(id | null)`
- Luật chính: chỉ 1 video được play tại một thời điểm

## 3. Data flow runtime

1. App mount -> `useFeed` gọi page đầu qua `getFeed`.
2. Feed render thành nhiều page full-height (snap).
3. `IntersectionObserver` chọn item có visibility cao nhất làm `activeId`.
4. `activeId` đổi -> `PlaybackController.setActiveItem(...)`:
   - video active play
   - video khác pause ngay
5. Khi gần cuối list (`activeIndex` sát cuối), tự load page tiếp theo.
6. Interaction (like/save/share/comment):
   - cập nhật optimistic trên reducer trước
   - gửi mock API sau
   - fail thì rollback từ snapshot

## 4. Các quyết định tối ưu hiệu năng

### 4.1 Windowed rendering

- Chỉ mount video cho vùng `active +/- 2` (khoảng 3-5 node)
- Item ngoài window render poster thay vì video
- Giảm memory pressure và decode cost khi user scroll dài

### 4.2 IntersectionObserver thay cho scroll handler nặng

- Không chạy logic active-item theo từng event scroll
- Browser xử lý observation hiệu quả hơn, giảm JS work trên main thread

### 4.3 Single-active-player policy

- Chủ động pause toàn bộ video không active
- Tránh double-play, tránh tranh chấp decode/audio pipeline

### 4.4 Prefetch có giới hạn

- Prefetch item lân cận để swipe mượt hơn
- Dùng preload link có cap (`MAX_PRELOAD_LINKS`) để không tăng bộ nhớ vô hạn
- Poster preload async trong idle window

### 4.5 Defer non-critical tasks

- Analytics/log phụ chạy qua `requestIdleCallback` fallback
- Ưu tiên main thread cho render + playback

## 5. Vì sao phù hợp interview

- Có architecture rõ ràng theo lớp: UI / state / data / playback
- Có trade-off rõ:
  - chọn mock API để kiểm soát demo và tập trung perf frontend
  - chấp nhận feature scope nhỏ để đi sâu vào độ mượt
- Có kiểm chứng kỹ thuật:
  - unit test reducer/playback
  - smoke test active-item switch
  - build/lint/test pass

## 6. Test & quality hiện có

- `src/store/feedReducer.test.ts`
  - dedupe feed
  - optimistic like
  - rollback interaction
- `src/lib/playbackController.test.ts`
  - single active playback
  - preload cap
- `src/App.smoke.test.tsx`
  - app load feed
  - active item đổi theo observer
  - guard số video mounted

Lệnh kiểm tra:

```bash
npm run lint
npm run test
npm run build
```

## 7. Các giới hạn hiện tại (chủ động)

- Chưa có backend thật và persistence interaction
- Chưa có adaptive bitrate stream/HLS
- Chưa có tracking performance tự động xuất report CI

Những phần này có thể là "next step" sau khi hoàn thành interview demo.
