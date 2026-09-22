# EduChain

EduChain is an online learning platform with two React applications, an Express API, a MySQL database, and an EVM smart contract. Students can buy courses with MetaMask, complete lessons and tests, and receive certificates issued by an administrator. The contract records course purchases and certificate hashes.

The interface currently contains Vietnamese text. This README and the deployment configuration are in English.

## Project layout

| Path | Purpose |
| --- | --- |
| `student/` | Student React and Vite application |
| `admin/` | Administrator React and Vite application |
| `backend/` | Express API, Sequelize models, and MySQL access |
| `blockchain/` | Hardhat contract, deployment script, and contract tests |
| `compose.yaml` | Production container stack for MySQL, API, and static frontends |

## Features

- Student and administrator accounts with JWT authentication.
- Course, lesson, test, student, and certificate management.
- MetaMask wallet connection with a signed challenge.
- Course purchases recorded by the EduChain smart contract.
- Backend verification of the purchase transaction, buyer wallet, contract, course ID, amount, and chain before enrollment in production.
- Public certificate verification and blockchain transaction views.

## Local development

Requirements: Node.js 22, npm, MySQL 8, MetaMask, and a local EVM node such as Ganache. The default frontend ports are 5173 for students and 5174 for administrators; the API uses port 5000.

1. Create a MySQL database named `educhain_lms`. The API creates tables from its Sequelize models on first startup. In development it also applies `sequelize.sync({ alter: true })` when models change.
2. Start Ganache and import an account into MetaMask. Keep its private key out of Git.
3. In `blockchain/`, copy `.env.example` to `.env`, set `RPC_URL` and `PRIVATE_KEY`, then run:

   ```bash
   npm ci
   npm run compile
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. Copy `backend/.env.example` to `backend/.env`. Set the MySQL credentials and a random `JWT_SECRET`, then run:

   ```bash
   cd backend
   npm ci
   npm run dev
   ```

5. In each frontend directory, copy `.env.example` to `.env` and set the deployed contract address. Example:

   ```env
   VITE_GANACHE_CHAIN_ID=1337
   VITE_GANACHE_RPC_URL=http://127.0.0.1:7545
   VITE_GANACHE_CURRENCY_SYMBOL=ETH
   VITE_CHAIN_NAME=Ganache Local
   VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
   VITE_API_URL=http://localhost:5000/api
   ```

6. Run `npm ci && npm run dev` in `student/` and `admin/` in separate terminals. Open `http://localhost:5173` and `http://localhost:5174`.

In development, the admin app allows registration. In production, public admin registration is disabled and administrators are created with a one-time CLI command.

## Production deployment with Docker Compose

The included stack runs MySQL in a persistent Docker volume, the API as an unprivileged Node process, and each frontend as a static Nginx site. The frontend sites proxy `/api` to the API service. HTTP ports bind to `127.0.0.1` so a host-level HTTPS reverse proxy can publish them safely.

1. Deploy the EduChain contract to a publicly reachable EVM network. In `blockchain/.env`, set the public `RPC_URL` and deployment `PRIVATE_KEY`, then run:

   ```bash
   cd blockchain
   npm ci
   npm run compile
   npx hardhat run scripts/deploy.js --network configured
   ```

   Record the contract address. The deployer must be the contract owner for administrator transactions. Never put the deployment private key in frontend configuration.

2. Copy the root `.env.example` to `.env.production`. Replace all passwords, secrets, RPC URLs, chain IDs, and contract addresses. The `VITE_*` values are compiled into public browser bundles. `CHAIN_RPC_URL`, `CHAIN_ID`, and `CONTRACT_ADDRESS` are used by the backend to verify purchases. Both sets must refer to the same chain and contract. A public RPC URL must be reachable from users' browsers; the backend RPC URL must be reachable from the API container.

3. Build and start the services:

   ```bash
   docker compose --env-file .env.production up -d --build
   docker compose --env-file .env.production ps
   curl http://127.0.0.1:8080/api/health
   ```

4. Set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the shell environment and create the first admin account. The password must be at least 12 characters:

   ```bash
   docker compose --env-file .env.production run --rm -e ADMIN_EMAIL -e ADMIN_NAME -e ADMIN_PASSWORD api npm run create-admin
   ```

5. Configure an HTTPS reverse proxy on the host. Route the student hostname to `127.0.0.1:8080` and the admin hostname to `127.0.0.1:8081`. Set valid TLS certificates. Set `CORS_ORIGINS` only if you intentionally call the API from a different browser origin; the included `/api` proxy uses the same origin.

6. Back up the MySQL volume regularly. Keep `.env.production` and all wallet private keys outside Git. For later schema changes, apply a reviewed database migration before starting the new API version. Production startup creates missing tables but does not automatically alter existing ones.

`CHAIN_CONFIRMATIONS` defaults to 1. Increase it if the chosen network needs additional confirmation before enrollment; the frontend may need to wait or retry the API request after mining.

### Production checks

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 api
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8081/api/health
```

A newly registered student should connect MetaMask, sign the wallet challenge, and buy a course on the configured chain. The API will reject a reused, failed, wrong-chain, wrong-wallet, wrong-course, or underpaid transaction.

## Authentication and permissions

- Students can self-register and access their own enrollments, lessons, tests, and certificates.
- Administrators manage courses, lessons, tests, students, and certificates.
- Public administrator registration is disabled when `NODE_ENV=production`.
- `npm run create-admin` in `backend/` creates an administrator after the database is ready.
- JWTs expire after seven days. The wallet connection endpoint requires a signed, short-lived challenge.

## Main routes

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/wallet-challenge`, `/api/auth/connect-wallet` |
| Courses | `/api/courses` and nested lesson and course endpoints |
| Enrollment | `POST /api/enrollments/buy-course` |
| Tests | `/api/tests` |
| Certificates | `/api/certificates` |
| Users | `/api/users` |

The student app includes public course pages and `/verify-certificate`; authenticated pages include `/my-courses`, `/learn/:id`, `/certificates`, `/transactions`, and `/profile`. The admin app includes course, lesson, test, student, transaction, certificate, and wallet management pages.

## Contract and payment flow

1. An administrator creates a course on-chain and stores its on-chain course ID with the API course.
2. A student connects a wallet by signing a challenge tied to their account.
3. MetaMask sends `buyCourse` to the configured contract.
4. The frontend submits the mined transaction hash to the API.
5. In production, the API checks the transaction receipt and `CourseBought` event against the linked wallet, contract address, chain ID, on-chain course ID, and database price. The transaction hash can be used only once.
6. An administrator can issue a certificate; its hash is recorded on-chain and can be checked publicly.

## Learning and certificate workflow

After buying a course, the student sees it in **My Courses** and can open its lessons and tests. The backend scores each submitted test and stores the result. A student is eligible for a certificate only after passing every test in the course. The student cannot issue a certificate directly.

For issuance, the administrator selects a course and an eligible student. The backend checks that the student is enrolled, has passed all tests, has a linked wallet, has not received a certificate already, and that the course has an on-chain ID. Only then does MetaMask request a signature to store the certificate hash on-chain. The backend stores the certificate after the on-chain transaction succeeds.

Anyone can open the student site's `/verify-certificate` page without signing in. They can enter a certificate code or hash. The page shows the student, course, issuer, issue date, certificate hash, on-chain course ID, and blockchain verification status when those details are available.

## Frontend pages

| Student path | Purpose |
| --- | --- |
| `/`, `/courses`, `/courses/:id` | Home, course catalog, and course details |
| `/register`, `/login`, `/connect-wallet` | Account and wallet setup |
| `/my-courses`, `/learn/:id` | Purchased courses and learning content |
| `/certificates`, `/verify-certificate` | Personal certificates and public verification |
| `/transactions`, `/profile` | Wallet activity and account details |

| Admin path | Purpose |
| --- | --- |
| `/`, `/login`, `/connect-wallet` | Dashboard and access |
| `/create-course`, `/manage-courses` | Course creation and management |
| `/manage-courses/:id/lessons` | Lesson management |
| `/manage-courses/:id/tests` | Test and question management |
| `/manage-courses/:id/students`, `/manage-students` | Student activity and results |
| `/issue-certificate`, `/send-eth` | Certificate issuance and ETH transfers |
| `/transactions`, `/profile` | Blockchain history and account details |

The admin `/register` page is available only in development. Both apps let users update their name and password; email and role are not directly editable from the profile page.

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register`, `/api/auth/login` | Account creation and login |
| `GET`, `PUT` | `/api/auth/me` | Read or update profile |
| `PUT` | `/api/auth/change-password` | Change password |
| `POST` | `/api/auth/wallet-challenge`, `/api/auth/connect-wallet` | Prove wallet ownership and link it |
| `GET` | `/api/courses`, `/api/courses/:id` | Browse courses |
| `GET` | `/api/courses/:id/learn`, `/api/courses/my-courses` | Access owned courses |
| `POST` | `/api/courses` | Create a course |
| `GET` | `/api/courses/:id/students`, `/api/courses/:id/results` | Student and test results |
| `GET`, `POST` | `/api/courses/:id/lessons` | Read or add lessons |
| `GET` | `/api/tests/course/:courseId` | List course tests |
| `POST` | `/api/tests/:courseId` | Add a test |
| `PUT`, `DELETE` | `/api/tests/:testId` | Edit or delete a test |
| `POST` | `/api/tests/:testId/submit` | Submit answers |
| `POST` | `/api/enrollments/buy-course` | Record a verified purchase |
| `GET` | `/api/certificates/my`, `/api/certificates/verify-public` | Personal and public certificate lookup |
| `POST` | `/api/certificates/verify-eligibility`, `/api/certificates/issue` | Check eligibility and issue a certificate |
| `GET` | `/api/users/students` | List students for admin workflows |

## Blockchain activity and ETH transfers

The transaction pages use `CourseCreated`, `CourseBought`, and `CertificateIssued` contract events. They also display native ETH transfers, including transfers from an admin wallet to a student wallet. An administrator can send ETH from `/send-eth` to a student who has linked a wallet; MetaMask confirms the transfer and supplies its transaction hash. Students see transactions related to their wallet.

## Troubleshooting

- **MetaMask cannot connect:** check that the configured chain ID and RPC URL match the network added to MetaMask. For local Ganache, confirm its process and port are running.
- **Wrong contract address:** redeploying creates a new address. Update both frontend `.env` files for local development or both browser and server addresses in `.env.production`, then rebuild the frontends.
- **A course cannot be bought:** confirm the API course has the correct `onChainCourseId`, the contract course is active, the student's linked wallet is the payment wallet, and the payment is mined with enough confirmations.
- **Only-owner error during certificate issuance:** use the wallet that owns the deployed contract.
- **Certificate not found:** check the code or hash, that an administrator issued it, and that `/api/certificates/verify-public` responds.
- **Unknown database column:** the Sequelize model and deployed schema differ. In production, apply a reviewed migration; do not enable automatic `alter` on a live database.
- **Direct page refresh returns 404:** ensure the Nginx SPA fallback from the included configuration is in use.

## Operational limits

The provided files are a deployment baseline, not an audit of the application or smart contract. Before handling real funds, review the contract and authorization logic, add database migrations for ongoing releases, set up monitoring and backups, and test recovery. Some interface copy still refers to local Ganache even when a public chain is configured. The backend accepts only verified ETH purchases in production; coin and free enrollment modes remain development features. The current backend dependency audit reports two moderate advisories inherited from Sequelize's `uuid` dependency; avoid a forced major downgrade and reassess this before public launch.
