# Phone Collector – Chrome extension

Thu thập **số điện thoại mà người dùng tự đăng công khai** trên trang đang xem (ví dụ: bình luận chốt đơn dưới bài bán hàng, livestream, bài trong nhóm), kèm tên người bình luận và nội dung, rồi xuất ra CSV.

> Extension **không** tra cứu SĐT từ UID Facebook. Tính năng đó chỉ làm được bằng dữ liệu rò rỉ, xâm phạm quyền riêng tư và vi phạm Nghị định 13/2023/NĐ-CP.

## Cài đặt
1. Mở `chrome://extensions`, bật **Developer mode**.
2. Bấm **Load unpacked**, chọn thư mục `extension/`.

## Sử dụng
1. Mở bài viết hoặc livestream cần lấy số.
2. Bấm biểu tượng extension:
   - **Quét trang**: tìm SĐT trong nội dung đang hiển thị.
   - **Mở rộng bình luận**: bấm các nút "Xem thêm bình luận/phản hồi" rồi tự quét lại (bấm nhiều lần nếu bài có nhiều bình luận).
   - **Sao chép SĐT** / **Xuất CSV** (CSV có BOM, mở bằng Excel không lỗi font).
3. Kết quả được lưu và bỏ trùng giữa các lần quét. Bấm **Xóa** để làm lại từ đầu.

Nhận diện các số di động Việt Nam dạng `0912345678`, `0912.345.678`, `0912 345 678`, `+84 912345678`, `84-91-234-5678`, và chuẩn hoá về dạng `0xxxxxxxxx`.

## Test
```
node extension/phone.test.js
```
