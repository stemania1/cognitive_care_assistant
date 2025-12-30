# How to Create Another Project

This guide shows you how to create a **new separate project** while keeping your current `cognitive_care_assistant` project completely intact. Both projects will exist independently in different folders.

## Option 1: Create a Fresh Next.js Project

### Step 1: Create a new Next.js project

```bash
# Using npm
npx create-next-app@latest my-new-project

# Or with specific options
npx create-next-app@latest my-new-project --typescript --tailwind --app --no-src-dir
```

This will prompt you with options:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router (recommended)
- ✅ src/ directory (optional)
- ✅ Import alias (@/*)

### Step 2: Navigate to the new project

```bash
cd my-new-project
```

### Step 3: Install additional dependencies (if needed)

Based on this project, you might want:

```bash
npm install @supabase/supabase-js
npm install socket.io socket.io-client
npm install chart.js react-chartjs-2
npm install express cors dotenv
npm install @hcaptcha/react-hcaptcha
npm install --save-dev concurrently
```

### Step 4: Set up environment variables

Create a `.env.local` file with your configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Option 2: Duplicate This Project

### Step 1: Copy the entire project

```bash
# Navigate to the parent directory
cd ..

# Copy the project folder
cp -r cognitive_care_assistant my-new-project
# On Windows PowerShell:
# Copy-Item -Path cognitive_care_assistant -Destination my-new-project -Recurse
```

### Step 2: Clean up the new project

```bash
cd my-new-project

# Remove node_modules and lock files
rm -rf node_modules package-lock.json
# On Windows PowerShell:
# Remove-Item -Recurse -Force node_modules, package-lock.json

# Remove any build artifacts
rm -rf .next
```

### Step 3: Update project name

Edit `package.json` and change the `name` field:

```json
{
  "name": "my-new-project",
  ...
}
```

### Step 4: Install dependencies

```bash
npm install
```

### Step 5: Update configuration files

- Update `README.md` with your new project description
- Update any hardcoded project names in configuration files
- Update `.env.local` with new credentials if needed

### Step 6: Initialize git (if using version control)

```bash
git init
git add .
git commit -m "Initial commit"
```

## Option 3: Use This Project as a Template

If you want to create a template for future projects:

1. Clean up this project (remove sensitive data, node_modules, etc.)
2. Create a `.gitignore` file to exclude unnecessary files
3. Create a repository from it
4. Clone it whenever you need a new project

## Quick Start Checklist for New Project

- [ ] Create/duplicate project folder
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables (`.env.local`)
- [ ] Configure Supabase (if using database)
- [ ] Update project name in `package.json`
- [ ] Test the dev server (`npm run dev`)
- [ ] Initialize git repository
- [ ] Update README with project-specific info

## Running Your New Project

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

