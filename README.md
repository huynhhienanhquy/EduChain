# EduChain Project - Nền tảng bán khóa học trực tuyến tích hợp Blockchain

EduChain là hệ thống học trực tuyến tích hợp Blockchain, cho phép học viên mua khóa học bằng ETH thông qua MetaMask, học bài, làm bài test và nhận chứng chỉ số do Admin cấp. Hệ thống sử dụng Ganache local để mô phỏng blockchain trong môi trường phát triển và demo.

---

## 1. Tổng quan dự án

Dự án gồm 4 phần chính:

```txt
educhain-project/
├── backend/      # Node.js + Express + Sequelize + MySQL
├── student/      # React + Vite cho học viên
├── admin/        # React + Vite cho quản trị viên
├── blockchain/   # Hardhat + Solidity Smart Contract
└── database-schema.sql
```

Công nghệ sử dụng:

```txt
Frontend: ReactJS, Vite, CSS Responsive
Backend: Node.js, Express.js
Database: MySQL
Blockchain: Solidity, Hardhat, Ganache
Web3: Ethers.js, MetaMask
Authentication: JWT
```

---

## 2. Chức năng chính

### 2.1. Chức năng phía Admin

Admin có thể:

- Đăng ký, đăng nhập
- Kết nối ví MetaMask
- Quản lý profile
- Tạo khóa học
- Tạo khóa học on-chain trên smart contract
- Quản lý khóa học
- Quản lý bài học
- Quản lý bài test
  - Thêm bài test
  - Sửa bài test
  - Xóa bài test
  - Thêm/xóa câu hỏi trong bài test
- Quản lý sinh viên
- Xem sinh viên đã mua khóa học
- Xem kết quả học tập của sinh viên
- Cấp chứng chỉ số cho sinh viên đủ điều kiện
- Tặng ETH cho sinh viên đã kết nối ví
- Xem lịch sử giao dịch blockchain
- Kiểm tra trạng thái ví, contract, network

### 2.2. Chức năng phía Student

Student có thể:

- Đăng ký, đăng nhập
- Kết nối ví MetaMask
- Quản lý profile
- Xem danh sách khóa học
- Xem chi tiết khóa học
- Mua khóa học bằng MetaMask
- Xem khóa học đã mua
- Vào học sau khi đã mua khóa học
- Làm bài test
- Xem điểm từng bài test
- Xem trạng thái đủ điều kiện nhận chứng chỉ
- Xem chứng chỉ đã được cấp
- Xem lịch sử giao dịch của ví
- Xác minh chứng chỉ công khai

### 2.3. Chức năng Blockchain

Hệ thống tích hợp smart contract `EduChain.sol` với các nghiệp vụ:

- Admin tạo khóa học on-chain
- Student mua khóa học bằng ETH
- Admin cấp chứng chỉ on-chain
- Lưu `certificateHash` lên smart contract
- Lấy `txHash` sau giao dịch thành công
- Xem lịch sử giao dịch từ event log blockchain
- Public verify certificate bằng certificate code hoặc certificate hash

---

## 3. Flow nghiệp vụ chính

### 3.1. Flow tạo khóa học

```txt
Admin nhập thông tin khóa học
↓
Nếu đã cấu hình contract address
↓
MetaMask mở popup xác nhận giao dịch
↓
Smart contract tạo course on-chain
↓
Hệ thống lấy onChainCourseId
↓
Backend lưu khóa học vào MySQL
```

Dữ liệu quan trọng:

```txt
onChainCourseId: ID khóa học trên blockchain
txHash: mã giao dịch blockchain
thumbnail: ảnh đại diện khóa học
```

### 3.2. Flow mua khóa học

```txt
Student mở chi tiết khóa học
↓
Bấm mua khóa học bằng MetaMask
↓
MetaMask xác nhận giao dịch
↓
Smart contract ghi nhận mua khóa học
↓
Frontend lấy txHash
↓
Backend lưu enrollment vào MySQL
↓
Student được mở khóa nội dung học
```

Sau khi đã mua khóa học, khi student vào lại trang chi tiết khóa học:

```txt
Ẩn nút mua khóa học
Hiện trạng thái "Đã sở hữu"
Hiện nút "Vào học ngay"
Hiện nút "Xem khóa học của tôi"
Hiện nút "Xem giao dịch"
```

### 3.3. Flow học và làm bài test

```txt
Student vào khóa học đã mua
↓
Xem bài giảng
↓
Làm từng bài test
↓
Backend chấm điểm
↓
Lưu kết quả vào TestResult
↓
Frontend hiển thị điểm từng bài test
```

Điều kiện đạt chứng chỉ:

```txt
Student phải pass tất cả bài test của khóa học
```

Ví dụ:

```txt
Bài test 1: Đạt
Bài test 2: Chưa thi
Bài test cuối khóa: Chưa thi
→ Chưa đủ điều kiện cấp chứng chỉ
```

### 3.4. Flow cấp chứng chỉ

```txt
Admin chọn khóa học
↓
Backend list sinh viên đủ điều kiện
↓
Admin chọn sinh viên
↓
Backend verify điều kiện trước
↓
Nếu chưa pass đủ test → dừng, không mở MetaMask
↓
Nếu đủ điều kiện → MetaMask mở để ký giao dịch
↓
Smart contract lưu certificateHash
↓
Backend lưu certificate vào MySQL


### 3.5. Flow xác minh chứng chỉ công khai

```txt
Người dùng vào trang /verify-certificate
↓
Nhập certificateCode hoặc certificateHash
↓
Backend tìm chứng chỉ trong MySQL
↓
Hiển thị thông tin chứng chỉ
↓
Có thể kiểm tra certificateHash trên smart contract
```

Thông tin hiển thị:

```txt
Mã chứng chỉ
Tên học viên
Email học viên
Tên khóa học
Người cấp
Ngày cấp
Certificate hash
On-chain course ID
Trạng thái kiểm tra blockchain
```

---

## 4. Cài đặt môi trường

Yêu cầu:

```txt
Node.js >= 18
MySQL hoặc XAMPP
Ganache GUI hoặc Ganache CLI
MetaMask extension
npm
```

---

## 5. Cấu hình MySQL

### 5.1. Tạo database

Mở MySQL hoặc phpMyAdmin và tạo database:

```sql
CREATE DATABASE educhain_lms;
```

Sau đó import file:

```txt
database-schema.sql
```

Hoặc dùng terminal:

```bash
mysql -u root -p educhain_lms < database-schema.sql
```

Nếu MySQL không có mật khẩu, nhấn Enter khi được hỏi password.

---

## 6. Chạy Ganache

Có thể dùng Ganache GUI.

Thông số đề xuất:

```txt
RPC URL: http://127.0.0.1:7545
Chain ID: 1337
Currency Symbol: ETH
```

Trong MetaMask thêm network:

```txt
Network Name: Ganache Local
RPC URL: http://127.0.0.1:7545
Chain ID: 1337
Currency Symbol: ETH
```

Nếu Ganache của bạn chạy port `8545`, sửa lại các file `.env` tương ứng.

---

## 7. Import tài khoản Ganache vào MetaMask

Trong Ganache:

```txt
Chọn account
Copy private key
Mở MetaMask
Import Account
Dán private key
```

Khuyến nghị:

```txt
Account #1: dùng cho Admin
Account #2: dùng cho Student
```

Lưu ý:

```txt
Ví deploy smart contract nên là ví Admin.
Khi cấp chứng chỉ hoặc tạo course on-chain, Admin cần dùng đúng ví owner contract.
```

---

## 8. Deploy Smart Contract

Vào thư mục blockchain:

```bash
cd blockchain
npm install
```

Tạo file `.env` từ `.env.example` nếu có:

```bash
cp .env.example .env
```

Cấu hình mẫu:

```env
RPC_URL=http://127.0.0.1:7545
PRIVATE_KEY=private_key_cua_vi_admin_trong_ganache
```

Compile contract:

```bash
npm run compile
```

Deploy contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Sau khi deploy, terminal sẽ in ra địa chỉ contract:


EduChain deployed to: 0x...


Copy địa chỉ này để cấu hình cho `admin` và `student`.

---

## 9. Cấu hình Backend

Vào thư mục backend:

```bash
cd backend
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Cấu hình mẫu:

```env
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=educhain_lms
DB_USER=root
DB_PASSWORD=

JWT_SECRET=replace_with_a_long_random_secret
```

Chạy backend:

```bash
npm run dev
```

Backend mặc định chạy tại:

```txt
http://localhost:5000
```

---

## 10. Cấu hình Student Frontend

Vào thư mục student:

```bash
cd student
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Cấu hình mẫu:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GANACHE_CHAIN_ID=1337
VITE_GANACHE_RPC_URL=http://127.0.0.1:7545
VITE_GANACHE_CURRENCY_SYMBOL=ETH
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Chạy student frontend:

```bash
npm run dev
```

Mặc định chạy tại:

```txt
http://localhost:5173
```

---

## 11. Cấu hình Admin Frontend

Vào thư mục admin:

```bash
cd admin
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Cấu hình mẫu:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GANACHE_CHAIN_ID=1337
VITE_GANACHE_RPC_URL=http://127.0.0.1:7545
VITE_GANACHE_CURRENCY_SYMBOL=ETH
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Chạy admin frontend:

```bash
npm run dev
```

Nếu student đang dùng port `5173`, admin thường sẽ chạy ở:

```txt
http://localhost:5174
```

---

## 12. Thứ tự chạy project chuẩn

Mở 4 terminal riêng:

### Terminal 1: Ganache

Mở Ganache GUI hoặc chạy Ganache CLI.

### Terminal 2: Backend

```bash
cd backend
npm run dev
```

### Terminal 3: Student

```bash
cd student
npm run dev
```

### Terminal 4: Admin

```bash
cd admin
npm run dev
```

Nếu cần deploy lại contract:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Sau khi deploy lại, nhớ cập nhật `VITE_CONTRACT_ADDRESS` trong:

```txt
admin/.env
student/.env
```

Sau đó restart admin và student frontend.

---

## 13. Tài khoản và phân quyền

Hệ thống có 2 role chính:

```txt
admin
student
```

Admin dùng app trong thư mục:

```txt
admin/
```

Student dùng app trong thư mục:

```txt
student/
```

Nếu tạo tài khoản mới, role được xác định theo logic backend/register hiện có.

---

## 14. Các route frontend chính

### Student

```txt
/                       Trang chủ
/register               Đăng ký
/login                  Đăng nhập
/courses                Danh sách khóa học
/courses/:id            Chi tiết khóa học
/connect-wallet         Kết nối ví
/my-courses             Khóa học của tôi
/learn/:id              Học khóa học
/certificates           Chứng chỉ của tôi
/transactions           Lịch sử giao dịch
/profile                Hồ sơ cá nhân
/verify-certificate     Xác minh chứng chỉ công khai
```

### Admin

```txt
/                            Dashboard
/register                    Đăng ký
/login                       Đăng nhập
/connect-wallet              Kết nối ví
/create-course               Tạo khóa học
/manage-courses              Quản lý khóa học
/manage-courses/:id/lessons  Quản lý bài học
/manage-courses/:id/tests    Quản lý bài test
/manage-courses/:id/students Quản lý sinh viên trong khóa
/issue-certificate           Cấp chứng chỉ
/send-eth                    Tặng ETH
/transactions                Lịch sử giao dịch
/manage-students             Quản lý sinh viên
/profile                     Hồ sơ cá nhân
```

---

## 15. API chính

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/me
PUT  /api/auth/change-password
POST /api/auth/connect-wallet
```

### Courses

```txt
GET  /api/courses
GET  /api/courses/:id
GET  /api/courses/:id/learn
GET  /api/courses/my-courses
POST /api/courses
GET  /api/courses/:id/students
GET  /api/courses/:id/results
```

### Lessons

```txt
GET  /api/courses/:id/lessons
POST /api/courses/:id/lessons
```

### Tests

```txt
GET    /api/tests/course/:courseId
POST   /api/tests/:courseId
PUT    /api/tests/:testId
DELETE /api/tests/:testId
POST   /api/tests/:testId/submit
```

### Enrollments

```txt
POST /api/enrollments/buy-course
```

### Certificates

```txt
GET  /api/certificates/my
GET  /api/certificates/verify-public
POST /api/certificates/verify-eligibility
POST /api/certificates/issue
```

Lưu ý:

```txt
POST /api/certificates/claim đã không còn là flow chính.
Student không tự nhận chứng chỉ.
Chứng chỉ phải do Admin cấp.
```

### Users

```txt
GET /api/users/students
```

---

## 16. Các file quan trọng

### Blockchain helper

```txt
admin/src/blockchain/educhain.js
student/src/blockchain/educhain.js
```

Các file này xử lý:

```txt
Kết nối MetaMask
Chuyển mạng Ganache
Tạo course on-chain
Mua course on-chain
Cấp chứng chỉ on-chain
Lấy lịch sử giao dịch blockchain
Verify certificate hash on-chain
```

### Auth Context

```txt
admin/src/contexts/AuthContext.jsx
student/src/contexts/AuthContext.jsx
```

Quản lý:

```txt
user state
login
logout
updateUser
localStorage token
```

### API Client

```txt
admin/src/api/client.js
student/src/api/client.js
```

Dùng để gọi backend API.

Nên cấu hình:

```js
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

### Certificate Controller

```txt
backend/src/controllers/certificate.controller.js
```

Xử lý:

```txt
Cấp chứng chỉ
Kiểm tra điều kiện cấp chứng chỉ
Xem chứng chỉ của student
Verify chứng chỉ public
```

### Course Controller

```txt
backend/src/controllers/course.controller.js
```

Xử lý:

```txt
Tạo khóa học
Xem khóa học
Học khóa học
Kết quả học tập
Danh sách student theo course
```

---

## 17. Logic chứng chỉ hiện tại

Điều kiện cấp chứng chỉ:

```txt
Student đã mua khóa học
Student đã pass tất cả bài test trong khóa học
Student đã kết nối ví MetaMask
Khóa học có onChainCourseId
Chưa được cấp chứng chỉ trước đó
```

Flow đúng:

```txt
Admin bấm cấp chứng chỉ
↓
Backend verify điều kiện trước
↓
Nếu lỗi → không mở MetaMask
↓
Nếu hợp lệ → mở MetaMask
↓
Smart contract lưu certificateHash
↓
Backend lưu certificate vào MySQL
```

Điều này tránh lỗi:

```txt
Blockchain giao dịch thành công nhưng backend từ chối lưu certificate
```

---

## 18. Lịch sử giao dịch blockchain

Hệ thống có trang transaction history cho cả Admin và Student.

Nguồn dữ liệu:

```txt
Smart contract events:
- CourseCreated
- CourseBought
- CertificateIssued

Native ETH transfers:
- Admin gửi ETH trực tiếp cho Student
```

Admin có thể xem nhiều loại giao dịch hơn.

Student chỉ xem giao dịch liên quan đến ví của mình.

---

## 19. Public Verify Certificate

Trang public:

```txt
/verify-certificate
```

Không yêu cầu đăng nhập.

Có thể nhập:

```txt
certificateCode
certificateHash
```

Hệ thống kiểm tra:

```txt
Có tồn tại trong MySQL không
Thông tin student/course/issuer
Có đủ dữ liệu check on-chain không
Certificate hash có khớp smart contract không
```

---

## 20. Tặng ETH cho Student

Admin có thể vào:

```txt
/send-eth
```

Logic hiện tại:

```txt
Backend list toàn bộ student
Chỉ cho chọn student đã kết nối ví
Admin nhập số ETH
MetaMask xác nhận giao dịch
Gửi ETH trực tiếp từ ví admin sang ví student
Hiện txHash
Có thể xem lại trong lịch sử giao dịch
```

---

## 21. Profile

Cả Admin và Student đều có trang:

```txt
/profile
```

Chức năng:

```txt
Xem thông tin tài khoản
Sửa họ tên
Xem email
Xem role
Xem walletAddress
Đổi mật khẩu
```

Không cho sửa email và role trực tiếp để tránh lỗi phân quyền.

---

## 22. Giao diện đã nâng cấp

Bản hiện tại đã nâng cấp UI:

```txt
Dashboard layout
Sidebar
Header
Footer
Responsive mobile/tablet/desktop
Auth layout đăng nhập/đăng ký
Course card hiện đại
Loading skeleton
Toast notification
Confirmation modal
Wallet status
Certificate verify UI
Transaction table
Profile UI
```

---

## 23. Lỗi thường gặp

### 23.1. MetaMask không kết nối được

Kiểm tra:

```txt
Ganache đã bật chưa
MetaMask đã thêm mạng Ganache chưa
Chain ID có đúng 1337 không
RPC URL đúng port 7545 hoặc 8545 chưa
```

### 23.2. Sai contract address

Nếu deploy lại contract, địa chỉ sẽ thay đổi.

Cần cập nhật lại trong:

```txt
admin/.env
student/.env
```

Sau đó restart frontend:

```bash
npm run dev
```

### 23.3. Student mua khóa học bị lỗi onChainCourseId

Nguyên nhân:

```txt
Course được tạo trong MySQL nhưng chưa tạo on-chain
```

Cách xử lý:

```txt
Admin tạo khóa học lại khi đã cấu hình contract address
Hoặc cập nhật onChainCourseId đúng với course trên contract
```

### 23.4. Admin cấp chứng chỉ bị lỗi không phải owner

Nguyên nhân:

```txt
Ví MetaMask hiện tại không phải ví deploy contract
```

Cách xử lý:

```txt
Chuyển MetaMask sang đúng account Ganache đã deploy contract
```

### 23.5. Verify certificate báo không tìm thấy

Kiểm tra:

```txt
Nhập đúng certificateCode hoặc certificateHash chưa
Chứng chỉ đã được Admin cấp chưa
Backend route /api/certificates/verify-public có hoạt động không
```

### 23.6. Frontend báo No routes matched location

Nguyên nhân:

```txt
Chưa khai báo route trong App.jsx
```

Ví dụ với verify certificate cần có:

```jsx
<Route path="/verify-certificate" element={<VerifyCertificatePage />} />
```

### 23.7. Backend lỗi Unknown column

Nguyên nhân thường là:

```txt
Model Sequelize đang query cột không tồn tại trong database
```

Cách xử lý:

```txt
Kiểm tra lại database-schema.sql
Kiểm tra model
Không query courseId trong TestResult nếu bảng không có cột đó
Phải đi qua quan hệ Course -> Test -> TestResult
```

---

## 24. Ghi chú triển khai public

Hiện tại hệ thống đang chạy với:

```txt
Ganache local
MetaMask local network
MySQL local hoặc cloud
Backend local
Frontend local
```

Có thể deploy public theo 2 hướng.

### 24.1. Public demo

```txt
Frontend deploy Vercel/Netlify
Backend deploy Render/Railway
Database dùng MySQL cloud
Blockchain vẫn Ganache local
```

Kết quả:

```txt
Website online
API online
Database online
Chức năng không phụ thuộc blockchain chạy được
```

Hạn chế:

```txt
Blockchain không public thật
Người khác không dùng được Ganache trên máy bạn
```

### 24.2. Public Web3 đúng nghĩa

Nên dùng testnet:

```txt
Sepolia
Polygon Amoy
BNB Testnet
```

Khi đó:

```txt
Deploy smart contract lên testnet
Cập nhật contract address frontend
MetaMask dùng testnet
Giao dịch có thể kiểm tra trên blockchain explorer
```

Đây là hướng phù hợp nếu muốn demo Web3 công khai.

---

## 25. Hướng phát triển

Có thể nâng cấp thêm:

```txt
Deploy smart contract lên Sepolia hoặc Polygon Amoy
Mint NFT Certificate chuẩn ERC721
Lưu metadata chứng chỉ lên IPFS
Upload thumbnail khóa học bằng Multer hoặc Cloudinary
Dashboard thống kê nâng cao
Backend verify txHash bằng RPC
Activity log cho Admin
Phân quyền chi tiết hơn
Tìm kiếm/lọc khóa học nâng cao
Email thông báo khi được cấp chứng chỉ
```

---

## 26. Kết luận

EduChain là hệ thống học trực tuyến tích hợp Blockchain với đầy đủ luồng:

```txt
Admin tạo khóa học
Student mua khóa học bằng MetaMask
Student học và làm bài test
Admin cấp chứng chỉ số
Certificate hash được lưu on-chain
Người dùng xác minh chứng chỉ công khai
```
