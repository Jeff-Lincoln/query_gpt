# Interactive Q&A System

A modern full-stack web application that provides an intelligent question-answering system powered by AI. Users can input queries and receive accurate, well-formatted responses in real-time.

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel/Netlify]
- **Backend API**: [Deployed on Railway/Render]

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - Latest version with App Router
- **TypeScript** - For type safety and better development experience
- **TailwindCSS** - For modern, responsive styling
- **Clerk** - Authentication and user management

### Backend
- **FastAPI** - High-performance Python web framework
- **Python 3.11+** - Backend programming language
- **PostgreSQL** - Primary database
- **Supabase** - Database hosting and backend services

### AI Integration
- **DeepSeek** - LLM for generating intelligent responses
- Secure API integration with proper error handling

### Deployment
- **Frontend**: Vercel/Netlify
- **Backend**: Railway/Render/Digital Ocean
- **Database**: Supabase (hosted PostgreSQL)

## ✨ Features

- **Real-time Q&A**: Submit questions and get instant AI-powered responses
- **User Authentication**: Secure login/signup with Clerk
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Query History**: Track previous questions and responses (optional)
- **Loading States**: Smooth user experience with proper loading indicators
- **Error Handling**: Comprehensive error management on both frontend and backend
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │    FastAPI      │    │   DeepSeek API  │
│   Frontend      │───▶│    Backend      │───▶│      LLM        │
│   (Clerk Auth)  │    │  (PostgreSQL)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL database (Supabase account)
- Clerk account for authentication
- DeepSeek API key

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/qa-system.git
cd qa-system
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@host:port/database
DEEPSEEK_API_KEY=your_deepseek_api_key
SECRET_KEY=your_secret_key
CORS_ORIGINS=http://localhost:3000
```

Run the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 API Documentation

The FastAPI backend automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main Endpoints

- `POST /api/v1/query` - Submit a question and get AI response
- `GET /api/v1/history` - Retrieve user's query history
- `GET /api/v1/health` - Health check endpoint

## 🎯 Example Use Case

**User Input**: "What documents do I need to travel from Kenya to Ireland?"

**AI Response**:
- Required visa documentation
- Passport requirements  
- Additional necessary documents
- Relevant travel advisories

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚢 Deployment

### Backend Deployment
1. Configure environment variables on your hosting platform
2. Set up PostgreSQL database on Supabase
3. Deploy using Docker or platform-specific methods

### Frontend Deployment
1. Configure Clerk authentication for production
2. Set production API endpoint
3. Deploy to Vercel/Netlify

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...
SECRET_KEY=your-secret-key
CORS_ORIGINS=https://yourfrontend.com
ENVIRONMENT=production
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_API_BASE_URL=https://yourapi.com
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface using TailwindCSS
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant components

## 🔒 Security

- **Authentication**: Clerk-based user authentication
- **API Security**: JWT token validation
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Sensitive data protection

## 📖 Prompt Engineering

The system uses carefully crafted prompts to ensure high-quality responses from DeepSeek:

- Context-aware prompting
- Response formatting instructions
- Error handling for edge cases
- Optimized for specific use cases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- [List any known issues or limitations]

## 🗺️ Roadmap

- [ ] Add query history persistence
- [ ] Implement response caching
- [ ] Add multiple LLM support
- [ ] Enhanced analytics dashboard

## 📞 Support

For support, email support@yourapp.com or create an issue in this repository.

---

**Built with ❤️ using Next.js 15, FastAPI, and DeepSeek**
