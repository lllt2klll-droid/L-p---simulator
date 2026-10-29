# PLAN.md — LỐP DỰ PHÒNG: HÀNH TRÌNH SI TÌNH

## 1. Mục tiêu

Xây dựng một game web nhỏ chạy trên GitHub Pages, kết hợp đồ họa lốp xe 3D với trò chơi trả lời 10 câu hỏi trắc nghiệm hài hước về tình yêu đơn phương.

Ưu tiên:
- Đồ họa đẹp, vui nhộn, màu sắc tươi sáng.
- Chiếc lốp 3D là nhân vật trung tâm.
- Người chơi được tùy chỉnh ngoại hình lốp.
- Lốp thực sự lăn trên bề mặt cong của quả địa cầu.
- Câu hỏi và các kết thúc tạo nên sự hài hước của trò chơi.
- Code đơn giản, dễ sửa đổi, triển khai trực tiếp trên GitHub Pages.

Không xây dựng game nhập vai, hệ thống chỉ số nhân vật, cửa hàng, nhiệm vụ phụ hoặc backend.

## 2. Công nghệ

- HTML5
- CSS3
- JavaScript ES Modules
- Three.js
- Google Fonts: Quicksand
- GitHub Pages

Không cần máy chủ, cơ sở dữ liệu hoặc API.

## 3. Cấu trúc dự án

/index.html
/PLAN.md
/style.css
/src/main.js
/src/scene.js (hoặc environment.js)
/src/tire.js
/src/questions.js
/src/ui.js
/src/earth.js
/src/camera.js
/src/audio.js
/assets/

Có thể điều chỉnh cấu trúc nếu cần, nhưng không chia nhỏ code quá mức.

## 4. Màn hình bắt đầu

Hiển thị:
- Tên game: LỐP DỰ PHÒNG — HÀNH TRÌNH SI TÌNH.
- Một chiếc lốp 3D dễ thương.
- Quả địa cầu 3D làm nền.
- Nút BẮT ĐẦU.
- Nút TÙY CHỈNH LỐP.

Có thể cho lốp xoay nhẹ tại chỗ để tạo cảm giác sống động.

## 5. Tùy chỉnh ngoại hình lốp

Cho phép người chơi thay đổi một số thuộc tính đơn giản:
- Màu thân lốp.
- Kiểu gai lốp (Chevron V-Groove, Chunky Cleats, Cute Hearts).
- Màu và kiểu mắt (Tròn long lanh, Mắt híp cười, Kính râm ngầu).
- Biểu cảm khuôn mặt (Vui vẻ, Tự tin, Tinh nghịch).
- Phụ kiện nhỏ: Nơ hồng xinh, Kính râm sành điệu, Khăn quàng ấm áp, hoặc Vương miện TÂN.

Hiển thị thay đổi ngay trên mô hình 3D.
Không cần hệ thống lưu tài khoản. Lưu lựa chọn trong trạng thái phiên chơi hiện tại.

## 6. Màn hình chơi 3D

### Cảnh vật
- Một quả địa cầu 3D đủ lớn, có màu xanh dương, xanh lá và mây đơn giản.
- Bề mặt địa cầu có độ cong rõ ràng.
- Một chiếc lốp 3D nằm trên bề mặt quả cầu.
- Ánh sáng mềm, bóng đổ, vật liệu đẹp và màu sắc dễ nhìn.
- Camera theo dõi chiếc lốp, cho phép quan sát địa cầu.

### Điều khiển
- Nút trái/phải hoặc A/D: di chuyển và bẻ lái trên bề mặt địa cầu.
- Nút tiến/lùi hoặc W/S: di chuyển theo hướng tiếp tuyến.
- Phím mũi tên trên máy tính.
- Cần điều khiển ảo (Joystick) hoặc nút cảm ứng lớn trên điện thoại.
- Lăn bằng toán học mặt cầu (Great-Circle rotation), đảm bảo lốp bám chặt mặt địa cầu.

## 7. Hệ thống 10 câu hỏi

10 câu hỏi trắc nghiệm hài hước về thân phận "lốp dự phòng":
1. Cô ấy gọi bạn lúc 2 giờ sáng. Bạn nghĩ gì?
2. Cô ấy bảo bạn là người rất đặc biệt.
3. Người yêu cô ấy chê bạn không bằng người ta.
4. Cô ấy hỏi: “Nếu em và anh ấy cùng rơi xuống nước, anh cứu ai?”
5. Cô ấy đăng ảnh nắm tay người yêu, còn bạn đang nằm trong cốp.
6. Vì sao bạn vẫn yêu cô ấy dù cô ấy chỉ coi bạn là lốp dự phòng?
7. Cô ấy bảo: “Anh là chỗ dựa vững chắc của em.” Bạn hiểu thế nào?
8. Người yêu cô ấy hỏi bạn có quan hệ gì với cô ấy.
9. Cô ấy nói: “Em cần thời gian để suy nghĩ.” Bạn làm gì?
10. Nếu được tái sinh, bạn muốn trở thành gì để cô ấy yêu?

## 8. Kết hợp di chuyển và câu hỏi

- Người chơi lăn bánh trên bề mặt Trái Đất.
- Sau mỗi quãng đường lăn (hoặc khi chạm vào Trạm Tình Yêu / Tim hồng), chiếc lốp dừng lại và mở bảng câu hỏi trắc nghiệm.
- Người chơi chọn 1 trong 4 đáp án (A, B, C, D).
- Hiện phản hồi hài hước tức thì tương ứng với đáp án đã chọn.
- Nhấn "TIẾP TỤC HÀNH TRÌNH" để lăn tiếp đến câu hỏi tiếp theo.
- Sau câu 10, mở màn hình kết thúc.

## 9. Ba kết thúc độc đáo

- **Kết thúc B — CHỌN TOÀN C (Ưu tiên cao nhất)**: Nếu chọn C cả 10 câu.
  - Lời kết: “Bạn không cần đáp án đúng. Bạn chỉ cần đáp án C.”
  - Hiệu ứng: Chữ C bay lượn ngập trời.
- **Kết thúc A — SIÊU LỐP**: Nếu chọn từ 6 đáp án siêu lốp trở lên.
  - Lời kết: “Không phải ai cũng xứng đáng với áp suất của bạn!”
  - Hiệu ứng: Hào quang siêu lốp tỏa sáng rực rỡ.
- **Kết thúc C — THỨC TỈNH**: Kết thúc mặc định khi không đạt 2 điều kiện trên.
  - Lời kết: “Bạn không phải lốp dự phòng của cuộc đời ai cả. Hãy tự lăn con đường của mình!”
  - Hiệu ứng: Lốp đeo kính râm tự tin lăn về chân trời mới.
- Có nút "CHƠI LẠI" để bắt đầu hành trình mới.
