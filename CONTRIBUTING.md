# Contributing to KrishiSetu 🌾

Thank you for your interest in contributing to KrishiSetu! We welcome contributions from everyone — whether you're fixing bugs, adding features, improving documentation, or suggesting ideas.

Your contributions help make agricultural supply chains more transparent and impactful. 💚

---

## Getting Started

### 1. Fork the Repository

Click the **Fork** button on GitHub and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/KrishiSetu.git
cd KrishiSetu
```

Add upstream remote:

```bash
git remote add upstream https://github.com/aditiraj2006/KrishiSetu.git
git remote -v
```

---

### 2. Install Dependencies

Install project dependencies:

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory.

Copy values from `.env.example` and add your credentials.

Example:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ Never commit `.env` files.

---

### 4. Run the Project

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5001
```

---

# Branch Naming Convention

Use meaningful branch names:

```text
feature/add-new-feature
bugfix/fix-critical-bug
docs/update-readme
refactor/optimize-code
test/add-unit-tests
```

---

# Commit Message Format

Use descriptive commit messages.

Examples:

```text
[feat] Add new QR code feature
[fix] Resolve product search bug
[docs] Update setup instructions
```

---

# Contribution Workflow

### Step 1: Update Repository

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

### Step 2: Create Feature Branch

```bash
git checkout -b feature/amazing-feature
```

---

### Step 3: Make Changes

Write clean, well-documented code.

Keep commits focused and atomic.

Commit:

```bash
git add .
git commit -m "[feat] Add amazing feature"
```

---

### Step 4: Test Your Changes

Before submitting:

- Run the project locally
- Check console errors
- Test functionality
- Verify UI responsiveness
- Ensure no sensitive files are committed

---

### Step 5: Push Changes

```bash
git push origin feature/amazing-feature
```

---

### Step 6: Create Pull Request

When opening a PR:

Include:

- Clear description of changes
- Why changes are needed
- Steps to test
- Screenshots (for UI changes)
- Related issue reference (`Fixes #123`)

---

# Pull Request Checklist

Before submitting PR:

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated if needed
- [ ] Related issue linked
- [ ] No `.env` files included

---

# Coding Standards

Please follow:

✅ TypeScript best practices  
✅ Meaningful variable names  
✅ Small reusable functions  
✅ Add comments for complex logic  
✅ Format code consistently  
✅ Update documentation when required  

Avoid:

❌ Unnecessary style changes  
❌ Large unrelated PRs  
❌ Leaving `console.log()` in production  
❌ Committing sensitive credentials  

---

# Reporting Issues

When creating an issue, include:

- Problem description
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Environment details

---

# Need Help?

If you have questions:

- Open a GitHub Discussion
- Create an Issue
- Contact maintainers through repository channels

Thank you for contributing to KrishiSetu! 🚀