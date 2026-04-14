# 🌾 KrishiSetu – Transparent Agricultural Supply Chain Platform

<div align="center">

![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-success?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blue?style=for-the-badge)
![Node Version](https://img.shields.io/badge/Node-v16%2B-green?style=for-the-badge)

**Empowering farmers and consumers through transparent, decentralized agricultural supply chain management.**

[🌐 Live Demo](https://krishisetu-kqj9.onrender.com/) • [📖 GitHub Repo](https://github.com/aditiraj2006/KrishiSetu) • [🤝 Contribute](#-contributing) • [🐛 Report Issue](https://github.com/aditiraj2006/KrishiSetu/issues) • [💬 Discussions](https://github.com/aditiraj2006/KrishiSetu/discussions)

</div>

---

## 📌 About

**KrishiSetu** is an open-source platform that revolutionizes agricultural supply chains by enabling **direct connections** between farmers, distributors, retailers, and consumers. With **real-time tracking**, **QR code verification**, and **transparent pricing**, KrishiSetu eliminates middlemen exploitation while ensuring product authenticity and fair compensation for farmers.

Built with modern web technologies and designed with **beginner-friendly contributions** in mind, KrishiSetu is an ideal platform for developers to learn, collaborate, and make a real-world impact! 🌟

**[🚀 Visit Live Demo](https://krishisetu-kqj9.onrender.com/)** | **[⭐ Star on GitHub](https://github.com/aditiraj2006/KrishiSetu)**

---

## ✨ Features

- 🔐 **Role-Based Access Control** — Separate dashboards for farmers, distributors, retailers, and admins
- 📦 **Smart Product Registration** — Easy onboarding with automatic validation and categorization
- 📱 **QR Code System** — Generate, scan, and verify products instantly for authenticity
- 🌍 **Real-Time Translation** — Translate product details into 8+ Indian languages using AI
- ✏️ **AI Grammar Enhancement** — Real-time grammar corrections for product descriptions and stories
- 📊 **Supply Chain Visualization** — Interactive map showing product journey from farm to consumer
- 💳 **Payment Proof Management** — Transparent transaction documentation and verification
- 👤 **Complete User Profiles** — Verified credentials and role-specific information
- 📈 **Dashboard Analytics** — Real-time statistics on product distribution and supply chain health
- 🔄 **Ownership History** — Complete audit trail of all product transfers and ownership changes
- 📋 **Order Management** — Streamlined ordering and fulfillment between supply chain partners
- 🛡️ **Secure Authentication** — Firebase Auth with Google OAuth integration
- 🔒 **Privacy-First Design** — User data encryption and privacy controls

### Coming Soon 🚀
- 🤖 AI-powered product recommendations
- 📲 Native mobile apps (iOS & Android)
- ⛓️ Full blockchain integration for immutable records
- 📊 Advanced analytics and reporting dashboard
- 🌐 Multi-language support expansion

---

## 🌐 Live Demo

👉 **[Visit KrishiSetu Live](https://krishisetu-kqj9.onrender.com/)**

Want to see it in action? Click the link above to explore the platform!

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI library with hooks |
| **TypeScript** | 5.6+ | Type-safe development |
| **Vite** | 6.1+ | Lightning-fast build tool |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **shadcn/ui** | Latest | Accessible React components |
| **React Router** | 7.9+ | Client-side routing |
| **TanStack Query** | 5.60+ | Server state management |
| **React Hook Form** | 7.55+ | Form handling & validation |
| **Zod** | 3.24+ | TypeScript-first validation |
| **Firebase SDK** | 12.2+ | Authentication & services |

### Backend & Infrastructure
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime |
| **Express.js** | 4.21+ | Web server framework |
| **TypeScript** | 5.6+ | Type-safe backend code |
| **MongoDB** | 6.19+ | NoSQL database |
| **Firebase** | 12.2+ | Auth, database, storage |
| **Render** | - | Cloud deployment platform |

### AI & Services
- **Google Gemini AI** — Language translation & grammar correction
- **Firebase Authentication** — Secure user management
- **Firestore** — Real-time database

---

## 📁 Project Structure

Below is the folder and file structure of the KrishiSetu project 👇

```
KrishiSetu/
│
├── .github/
│   └── ISSUE_TEMPLATE/                # GitHub issue templates for contributors
│
├── client/                            # React Frontend Application
│   ├── public/                        # Static assets
│   │
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ui/                    # shadcn/ui base components
│   │   │   ├── DistributorProductForm.tsx
│   │   │   ├── ProductRegistrationForm.tsx
│   │   │   ├── ProductSearch.tsx
│   │   │   ├── QRCodeGenerator.tsx
│   │   │   ├── QRCodeScanner.tsx
│   │   │   ├── SupplyChainMap.tsx
│   │   │   ├── RoleDashboard.tsx
│   │   │   └── PaymentProofModal.tsx
│   │
│   ├── pages/                         # Full-page components (routes)
│   │   ├── LandingPage.tsx
│   │   ├── dashboard.tsx
│   │   ├── product-registration.tsx
│   │   ├── registered-products.tsx
│   │   ├── qr-scanner.tsx
│   │   ├── login.tsx
│   │   ├── profile.tsx
│   │   └── not-found.tsx
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Authentication logic
│   │   ├── useProducts.ts             # Product data management
│   │   └── use-toast.ts               # Toast notifications
│   │
│   ├── lib/                           # Utilities & configuration
│   │   ├── firebase.ts                # Firebase setup
│   │   ├── queryClient.ts             # TanStack Query config
│   │   └── utils.ts                   # Helper functions
│   │
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
│
├── server/                            # Express Backend Server
│   ├── index.ts                       # Server entry point
│   ├── routes.ts                      # API route definitions
│   ├── storage.ts                     # Database operations
│   └── vite.ts                        # Vite integration
│
├── shared/                            # Shared Code & Types
│   └── schema.ts                      # TypeScript interfaces & Zod schemas
│
├── uploads/                           # File Storage
│   └── payment-proofs/                # Payment documentation
│
├── .env.example                       # Example environment variables
├── .gitignore                         # Git ignore configuration
├── CODE_OF_CONDUCT.md                 # Community guidelines
├── CONTRIBUTING.md                    # Contribution guidelines
├── LICENSE.md                         # MIT License
├── PULL_REQUEST_TEMPLATE.md           # PR format template
├── README.md                          # This file 😄
│
├── package.json                       # Dependencies & scripts
├── package-lock.json                  # Lock file
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite configuration
├── tailwind.config.ts                 # Tailwind CSS config
├── postcss.config.js                  # PostCSS setup
└── eslint.config.js                   # ESLint configuration
```

---

## ⚙️ Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/aditiraj2006/KrishiSetu.git
cd KrishiSetu
```

### Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### Configure Environment Variables

1. Create a `.env` file in the root directory
2. Copy values from `.env.example`
3. Add your Firebase credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# API Keys
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file. It contains sensitive credentials!

### Start Development Servers

**Terminal 1 - Backend Server:**
```bash
npm run dev
# Backend runs at http://localhost:10000
```

**Terminal 2 - Frontend Development:**
```bash
cd client
npm run dev
# Frontend runs at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## ▶️ Usage

1. **Sign Up / Log In** — Create your account using Firebase authentication
2. **Select Your Role** — Choose farmer, distributor, retailer, or admin
3. **Share Products** — Register agricultural products with details and media
4. **Scan QR Codes** — Verify product authenticity using QR code scanner
5. **Track Supply Chain** — Monitor product journey from farm to consumer
6. **Translate Content** — Automatically translate product info to regional languages
7. **Access Resources** — Browse verified NGO and support organization database
8. **Manage Orders** — Streamline ordering and fulfillment with supply chain partners

---

## 🤝 Contributing

We welcome contributions from everyone! Whether you're fixing bugs, adding features, or improving documentation, your help makes KrishiSetu better. 💖

### Contribution Process

1. **Fork the Repository** — Click the Fork button on GitHub
2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/KrishiSetu.git
   cd KrishiSetu
   git remote add upstream https://github.com/aditiraj2006/KrishiSetu
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes** — Write clean, well-documented code

5. **Commit with Clear Messages**
   ```bash
   git commit -m "[feat] Add new QR code feature"
   git commit -m "[fix] Resolve product search bug"
   git commit -m "[docs] Update setup instructions"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** — Include a detailed description and reference any related issues

### Code Standards

✅ **Do's**
- Follow TypeScript best practices
- Write meaningful variable names (avoid `x`, `temp`, etc.)
- Add comments for complex logic blocks
- Keep functions small and single-purpose
- Test your changes thoroughly
- Format code with Prettier
- Update documentation when needed

❌ **Don'ts**
- Don't add multiple unrelated changes in one PR
- Don't copy code without understanding it
- Don't ignore code review feedback
- Don't leave `console.log()` statements in production code
- Don't make unnecessary style changes
- Don't commit `.env` files

### Branch Naming Convention

```
feature/add-new-feature        # New feature
bugfix/fix-critical-bug        # Bug fix
docs/update-readme             # Documentation
refactor/optimize-queries      # Code refactoring
test/add-unit-tests           # Tests
```

### Pull Request Checklist

Before submitting your PR, ensure:

- [ ] PR title follows format: `[type] description` (e.g., `[feat] Add QR scanner`)
- [ ] Code follows our style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex areas
- [ ] No new console warnings introduced
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated
- [ ] Related issues linked (use `Fixes #123`)
- [ ] `.env` file is NOT included

---

## 🎯 Good First Issues & Labels

### Understanding Issue Labels

| Label | Color | Description | Best For |
|-------|-------|-------------|----------|
| 🟢 **good first issue** | `#90EE90` | Perfect for newcomers | First-time contributors |
| 🆘 **help wanted** | `#FFD700` | Extra hands needed | Anyone wanting to help |
| 🐛 **bug** | `#FF6B6B` | Something broken | Bug fixes |
| ✨ **enhancement** | `#87CEEB` | New feature | Feature implementation |
| 📚 **documentation** | `#DDA0DD` | Docs improvement | Writers |
| 🔧 **refactor** | `#F0E68C` | Code cleanup | Optimization |
| 🎨 **ui-ux** | `#FFA07A` | Design/UX | Frontend developers |
| 🚀 **performance** | `#20B2AA` | Speed improvement | Performance optimization |

### How to Find Issues

1. Visit the [Issues Page](../../issues)
2. Filter by `good first issue` label
3. Read the description carefully
4. Comment: "I'd like to work on this!"
5. Wait for maintainer approval
6. Start coding!

---

## 📝 Contribution Workflow (Step-by-Step)

### Step 1️⃣ Fork & Setup

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/KrishiSetu.git
cd KrishiSetu

# Add upstream remote to stay synchronized
git remote add upstream https://github.com/aditiraj2006/KrishiSetu.git
git remote -v  # Verify both remotes exist
```

### Step 2️⃣ Create Feature Branch

```bash
# Update from upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feature/amazing-feature
```

### Step 3️⃣ Implement Changes

```bash
# Edit files, add features, fix bugs
# Keep commits focused and atomic
git add .
git commit -m "[feat] Add amazing feature description"
```

### Step 4️⃣ Test Your Code

```bash
# Run both development servers
npm run dev                    # Backend
cd client && npm run dev       # Frontend (in another terminal)

# Test thoroughly:
# - Manual testing of your feature
# - Check for console errors
# - Test in different browsers
# - Verify responsive design
```

### Step 5️⃣ Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### Step 6️⃣ Create Pull Request

1. Go to your forked repository on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template with:
   - Clear description of changes
   - Why these changes are needed
   - How to test the changes
   - Screenshots (if UI changes)
   - Related issues (use `Fixes #123`)

### Step 7️⃣ Respond to Feedback

```bash
# Make requested changes
git add .
git commit -m "[fix] Address PR review feedback"
git push origin feature/amazing-feature
# Your PR updates automatically
```

### Step 8️⃣ Celebrate! 🎉

Your PR gets merged and you're now officially a KrishiSetu contributor!

---

## 🌟 Why Contribute?

Contributing to KrishiSetu offers numerous benefits:

✨ **Improve Your Skills** — Work with modern technologies and best practices
🤝 **Collaborative Community** — Learn from experienced developers
🏆 **Get Recognized** — Earn recognition and build your portfolio
📜 **Real-World Experience** — Contribute to a project with real-world impact
🌍 **Social Impact** — Help empower farmers and ensure transparent agriculture

---

## ✅ Contribution Best Practices

### ✅ Do's

✅ Read documentation thoroughly before contributing
✅ Follow code style and project structure
✅ Write descriptive commit messages
✅ Test your changes before submitting PR
✅ Be respectful and collaborative with other contributors
✅ Ask questions if you're unsure about anything
✅ Update documentation when adding features
✅ Give constructive feedback to other contributors

### ❌ Don'ts

❌ Don't spam with multiple PRs for the same issue
❌ Don't copy code without understanding it
❌ Don't make unnecessary changes
❌ Don't ignore code review feedback
❌ Don't forget to update documentation
❌ Don't commit sensitive files (`.env`, keys, etc.)
❌ Don't make commits with inappropriate messages
❌ Don't claim issues without intent to complete them

---

## 👥 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and kind to all community members
- Welcome and support newcomers in the community
- Provide constructive feedback
- Accept criticism gracefully
- Focus on what's best for the community

### Unacceptable Behavior

- Harassment, discrimination, or abusive language
- Offensive comments or personal attacks
- Publishing private information without consent
- Trolling or disruptive behavior
- Any form of "ism" (sexism, racism, etc.)

### Reporting Violations

If you witness or experience violations of our Code of Conduct, please report to the maintainers confidentially at:

📧 **Email**: [your-email@example.com]
📊 **GitHub**: [Create an issue](../../issues) with `[Code of Conduct]` tag

---

## 📧 Contact & Mentorship

For queries, feedback, or guidance regarding this project:

| Name | Role | Contact |
|------|------|---------|
| **Mentor 1** | Project Lead | [LinkedIn](https://linkedin.com) \| [Email](mailto:) |
| **Mentor 2** | Tech Lead | [LinkedIn](https://linkedin.com) \| [Email](mailto:) |
| **Mentor 3** | Community Manager | [LinkedIn](https://linkedin.com) \| [Email](mailto:) |

### Ways to Connect

💬 **GitHub Discussions** — Ask questions and share ideas
📧 **Email Mentors** — For direct assistance (mentioned above)
🐛 **GitHub Issues** — Report bugs or suggest features
💥 **PR Comments** — Tag maintainers for specific feedback

---

## ✨ Contributors

We're grateful to all our wonderful contributors! 💖

<!-- Contributors go here when we have them -->
*Be the first to contribute! 🚀*

---

## 📄 License

This project is licensed under the **MIT License** - See the [LICENSE](LICENSE) file for details.

**MIT License Summary:**
- ✅ You can use this code commercially
- ✅ You can modify and distribute the code
- ✅ You can use this code privately
- ❌ You cannot hold the creators liable
- ℹ️ You must include the original license and copyright notice

---

## 🙏 Support & Feedback

If you like this project, please consider:

- ⭐ **Starring** the repository (helps with discoverability)
- 🔗 **Sharing** with friends and colleagues
- 💬 **Giving feedback** to help us improve
- 🤝 **Contributing** your skills and time
- 📢 **Spreading the word** about transparent agriculture

---

<div align="center">

### 🌾 Made with ❤️ for Agriculture & Sustainability

**Every contribution brings us closer to empowering farmers and ensuring food transparency!**

[⬆ Back to Top](#-krishisetu--transparent-agricultural-supply-chain-platform)

</div>
