# Phone Collector – Chrome extension

Thu thập **số điện thoại mà người dùng tự đăng công khai** trên trang đang xem (ví dụ: bình luận chốt đơn dưới bài bán hàng, livestream, bài trong nhóm), kèm tên người bình luận và nội dung, rồi xuất ra CSV.

> Extension **không** tra cứu SĐT / email / ngày sinh từ UID hay link Facebook. Tính năng "UID → SĐT" của các công cụ khác chỉ chạy được nhờ kho dữ liệu cá nhân bị thu thập/rò rỉ, xâm phạm quyền riêng tư của người không hề chia sẻ số, và vi phạm Nghị định 13/2023/NĐ-CP. Phần đó cố ý không được xây dựng ở đây.

## Cài đặt
1. Mở `chrome://extensions`, bật **Developer mode**.
2. Bấm **Load unpacked**, chọn thư mục `extension/`.

## Sử dụng
1. Mở bài viết hoặc livestream cần lấy số.
2. Bấm biểu tượng extension:
   - **Quét trang**: tìm SĐT trong các bình luận/bài viết đang hiển thị.
   - **Cuộn & quét hết**: tự động cuộn, bấm các nút "Xem thêm bình luận / phản hồi" để tải hết rồi quét. Bấm **Dừng cuộn** để ngừng giữa chừng.
   - **Sao chép SĐT** / **Xuất CSV** (CSV có BOM, mở bằng Excel không lỗi font tiếng Việt).
3. Kết quả được lưu và bỏ trùng giữa các lần quét. Bấm **Xóa lịch sử** để làm lại từ đầu.

### Tùy chọn
- **Lưu cả comment không có số**: giữ lại mọi người bình luận (tên + nội dung), không chỉ những dòng có SĐT — để có danh sách tương tác đầy đủ.
- **Số lần cuộn tối đa**, **Đợi sau mỗi lần cuộn**, **Tạm dừng sau N lần cuộn**: tiết chế tốc độ cuộn (đợi ngẫu nhiên) để tránh tải trang quá nhanh, hữu ích với mạng chậm hoặc bài nhiều bình luận.

Nhận diện các số di động Việt Nam dạng `0912345678`, `0912.345.678`, `0912 345 678`, `+84 912345678`, `84-91-234-5678`, chuẩn hoá về `0xxxxxxxxx`. Nếu một bình luận chứa hai số, số thứ hai được lưu ở cột **SĐT2**.

## Cột trong CSV
`Ngày`, `SĐT`, `SĐT2`, `Người đăng`, `Nội dung`, `URL`.

## Test
```
node extension/phone.test.js
```

## Phạm vi & quyền riêng tư
Extension chỉ đọc nội dung **đang hiển thị trên trang người dùng tự mở** — không gọi máy chủ bên ngoài, không gửi dữ liệu đi đâu, không tra cứu từ UID. Bạn chịu trách nhiệm dùng dữ liệu thu thập được đúng pháp luật và được sự đồng ý của chủ thể dữ liệu khi cần.
