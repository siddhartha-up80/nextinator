# 🤖 NextINator

<div align="center">
  <img src="public/images/logo.jpg" alt="NextINator Logo" width="200" height="200" style="border-radius: 50%;">
  
  <h3>Your Ultimate AI-Powered Data Assistant</h3>
  <p>Transform your documents into intelligent conversations with advanced AI capabilities</p>

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.9.0-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

### 🎯 Core Functionality

- **🤖 AI Chat Interface** - Engage with multiple AI providers (OpenAI, Google AI, Anthropic, xAI)
- **📄 Document Processing** - Upload and extract text from PDFs automatically
- **🔍 Vector Search** - Advanced semantic search through your documents using Pinecone
- **💬 Intelligent Responses** - Get contextual answers based on your uploaded data
- **📚 Note Management** - Organize and manage your documents efficiently

### 🔐 Advanced Features

- **🔗 Chat Sharing** - Share conversations with secure, tokenized links
- **📱 Responsive Design** - Beautiful mobile and desktop experience
- **🌙 Dark/Light Mode** - Seamless theme switching
- **👥 User Authentication** - Secure login with Clerk
- **💾 Chat History** - Persistent conversation storage
- **🔄 Real-time Updates** - Live chat synchronization

### 🛠️ Technical Excellence

- **⚡ Modern Stack** - Built with Next.js 15, React 19, and TypeScript
- **🗄️ Database** - MongoDB with Prisma ORM
- **🎨 UI/UX** - Radix UI components with Tailwind CSS
- **📐 Architecture** - Clean, modular, and scalable codebase
- **🔧 Developer Experience** - Hot reload with Turbopack

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **MongoDB** database
- **Pinecone** account for vector storage

### 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/nextinator.git
   cd nextinator
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="your_mongodb_connection_string"

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   CLERK_SECRET_KEY="your_clerk_secret_key"
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
   NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

   # AI Providers
   GOOGLE_GENERATIVE_AI_API_KEY="your_google_ai_key"

   # Vector Database
   PINECONE_API_KEY="your_pinecone_api_key"
   PINECONE_ENVIRONMENT="your_pinecone_environment"
   PINECONE_INDEX="your_pinecone_index"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📖 Usage Guide

### 🔑 Getting Started

1. **Sign Up/Sign In** - Create an account or log in using Clerk authentication
2. **Add Your Data** - Click the "Add Data" button to upload PDF documents
3. **Start Chatting** - Use the AI chat interface to ask questions about your documents
4. **Manage Conversations** - Access chat history and share conversations with others

### 💡 Pro Tips

- **Document Processing**: Upload multiple PDFs to build a comprehensive knowledge base
- **Smart Queries**: Ask specific questions to get the most relevant answers
- **Chat Sharing**: Share important conversations with team members using secure links
- **Mobile Experience**: Use the responsive mobile interface for on-the-go access

---

## 🏗️ Architecture

### 📁 Project Structure

```
nextinator/
├── 📁 prisma/                 # Database schema and migrations
├── 📁 public/                 # Static assets
├── 📁 src/
│   ├── 📁 app/                # Next.js App Router pages
│   │   ├── 📁 api/            # API routes
│   │   ├── 📁 inator/         # Main application pages
│   │   └── 📁 shared-chat/    # Shared chat pages
│   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 main/           # Core application components
│   │   └── 📁 ui/             # Base UI components
│   └── 📁 lib/                # Utility functions and configurations
├── 📄 package.json
├── 📄 README.md
└── 📄 tsconfig.json
```

### 🔧 Tech Stack

| Category           | Technology                        |
| ------------------ | --------------------------------- |
| **Frontend**       | React 19, Next.js 15, TypeScript  |
| **Styling**        | Tailwind CSS, Radix UI            |
| **Database**       | MongoDB, Prisma ORM               |
| **Vector DB**      | Pinecone                          |
| **Authentication** | Clerk                             |
| **AI/ML**          | Google AI                         |
| **Development**    | Turbopack, ESLint                 |

---

## 📚 API Reference

### 🔗 Chat Endpoints

- `POST /api/chat` - Create a new chat message
- `GET /api/chat-sessions` - Retrieve chat sessions
- `POST /api/chat-sessions/{id}/share` - Share a chat session
- `DELETE /api/chat-sessions/{id}/share` - Unshare a chat session

### 📄 Notes Endpoints

- `GET /api/notes` - Retrieve user notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### 📋 Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

---

## 🔧 Configuration

### 🌐 Environment Variables

| Variable                       | Description                  | Required |
| ------------------------------ | ---------------------------- | -------- |
| `DATABASE_URL`                 | MongoDB connection string    | ✅       |
| `CLERK_SECRET_KEY`             | Clerk authentication secret  | ✅       |
| `PINECONE_API_KEY`             | Pinecone vector database key | ✅       |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key            | ✅       |

### ⚙️ Customization

- **Themes**: Modify theme colors in `tailwind.config.js`
- **Database**: Adjust schema in `prisma/schema.prisma`

---

## 📈 Performance & Optimization

- **🚀 Turbopack**: Lightning-fast development builds
- **📦 Code Splitting**: Automatic route-based code splitting
- **🎯 Vector Search**: Optimized semantic search with Pinecone
- **💾 Caching**: Intelligent caching strategies for better performance
- **📱 Progressive Enhancement**: Works great on all devices

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**

```bash
# Ensure your MongoDB connection string is correct
npx prisma db push
```

**PDF Processing Issues**

```bash
# Verify PDF files are not corrupted and under size limits
```

**API Key Errors**

```bash
# Double-check all environment variables are set correctly
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For the deployment platform
- **Clerk** - For seamless authentication
- **Gemini** - For powerful AI capabilities
- **Pinecone** - For vector database solutions

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/siddhartha-up80/nextinator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/siddhartha-up80/nextinator/discussions)
- **Email**: siddhartha.singh3093@gmail.com

---

<div align="center">
  <p>Made with ❤️ by Siddhartha Singh</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
