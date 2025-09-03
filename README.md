***

## 📜 Description

**OrbitTasks** is a modern, feature-rich task management web app that blends productivity with elegance.  
It’s designed to make **creating, organizing, and completing tasks** as seamless as possible.  
Whether you prefer filling in structured forms or simply typing sentences in natural language, OrbitTasks adapts to your workflow.

Key highlights:
- **Natural Language Input (NLP)** — Type phrases like _“Meet Bob tomorrow at 3 pm with high priority”_ and OrbitTasks will automatically detect and fill in the due date, time, priority, and description for you.
- **Recurring Tasks** — Set repeat schedules with intervals and end dates.
- **Completed Task Management** — View, timestamp, and toggle completed items with a draggable floating panel.
- **Custom Filters** — Quickly filter by category or priority using interactive pill-style tags.
- **Themes & UI Polish** — Switch between light and dark mode, with responsive, mobile-friendly design and interactive animations.

OrbitTasks is perfect for individuals who want their productivity tool to be as **smart** as it is **beautiful**.

***


## 🏗 Architecture

OrbitTasks follows a clean **frontend–backend** separation with a modern React codebase.

**Frontend:**
- **React** with Hooks for stateful, functional components.
- **Context API** (`AuthContext`, `TodosContext`) for global state management.
- **React Router DOM** for page routing and protected routes.
- **CSS Custom Properties** and modular styles for light/dark theming.
- **Optimistic UI Updates** for instant interactions while syncing with backend.
- **NLP Parsing** integrated in the task creation workflow.

**Backend** (expected implementation):
- A REST API handling authentication, profile, and task CRUD operations.
- **JWT or token-based authentication** for security.
- Database persistence for registered user data.
- Guest mode support with `localStorage` fallback.

**Storage:**
- **localStorage** for caching user sessions and guest tasks.
- Backend database for permanent account storage.

**UI Architecture Highlights:**
- Modular components for reusability (`TodoItem`, `TodoForm`, `CompletedTasksPanel`, etc.).
- **Drag & Drop** support for the floating completed tasks panel.
- Fully responsive, mobile-first design.

***

## 🚀 Installation & Commands

Follow these steps to setup and run OrbitTasks locally:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/devopse2e/orbittasks.git

# 2️⃣ Navigate into the project directory and then to backend folder
cd orbittasks
cd backend

# 3️⃣ Install dependencies
npm install

# 4️⃣ Start the backend
npm run dev
```



### frontend Commands in another terminal:
```bash
# 1️⃣ Open fresh terminal and change to orbitasks/frontend folder
cd frontend

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the backend
npm start
```

***
In you local environment/laptop update /etc/hosts with below

127.0.0.1 orbittasks


The app will start on **http://orbittasks** and support **hot module reloading** for instant feedback.
