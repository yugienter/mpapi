### Flow Biểu Đồ Quản Lý Phiên Bản Summary

1. **Tạo Summary (Admin)**

   - Admin tạo summary.
   - Status: DRAFT -> REQUEST.
   - Version: 1.
   - original_version_id: null.

2. **Xử lý Summary (User)**

   - User nhận summary với status REQUEST.
   - Có hai hướng phát triển:
     - Accept: Không thay đổi nội dung, chỉ thay đổi status.
     - Edit và Submit: Tạo bản mới với nội dung chỉnh sửa.
       - Version: 2.
       - original_version_id: ID của bản gốc.

3. **"Add to Master" (Admin)**

   - Chọn summary để "Add to Master".
   - Cập nhật status thành POSTED.
   - Set `is_public` true/false.

4. **Chỉnh Sửa sau POSTED (Admin)**

   - Chỉnh sửa summary đã POSTED.
   - Tạo bản mới với version tăng thêm.
   - original_version_id: ID của bản POSTED.

5. **Quản Lý Phiên Bản**
   - Các bản chỉnh sửa có liên kết đến original_version_id.
   - Cho phép so sánh giữa các phiên bản.

### Biểu Đồ Đề Xuất

- Sử dụng các hình vuông hoặc hình chữ nhật để biểu diễn các trạng thái (DRAFT, REQUEST, POSTED).
- Mũi tên chỉ hướng quá trình chuyển đổi từ trạng thái này sang trạng thái khác.
- Sử dụng màu sắc khác nhau để phân biệt hành động của Admin và User.
- Ghi chú về version và original_version_id ở mỗi bước quan trọng.
