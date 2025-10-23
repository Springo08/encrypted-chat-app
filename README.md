# 🔐 SecureChat - End-to-End Encrypted Chat App

A secure, end-to-end encrypted chat application built with Next.js, Supabase, and modern web technologies. Your conversations stay private with client-side encryption.

## ✨ Features

- 🔐 **End-to-End Encryption** using AES-GCM with PBKDF2 key derivation
- 🚀 **Real-time Messaging** with Supabase integration
- 👥 **Multi-user Chat Rooms** with secure access controls
- 🎨 **Modern, Responsive UI** built with Tailwind CSS and shadcn/ui
- 🔒 **Secure Authentication** with password-based encryption keys
- 📱 **Mobile-friendly** design
- 🛡️ **Row Level Security** policies in Supabase
- 📊 **Message Statistics** and unread counters
- 🔄 **Real-time Updates** (ready for implementation)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Encryption**: Web Crypto API (AES-GCM)
- **Authentication**: Custom JWT-based auth
- **Real-time**: Supabase Realtime (ready)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/encrypted-chat-app.git
   cd encrypted-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase Database**
   - Create a new Supabase project
   - Run the SQL scripts in the `scripts/` folder in order:
     ```sql
     -- Run these in Supabase SQL Editor:
     01-create-tables-optimized.sql
     02-enable-rls-optimized.sql
     03-create-functions-optimized.sql
     04-additional-features.sql
     ```

4. **Configure Supabase**
   - Update `lib/supabase.ts` with your Supabase URL and API key
   - Or set environment variables:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Register a new account or login
   - Start chatting securely!

## 🔐 How Encryption Works

1. **Key Derivation**: Your password is used with PBKDF2 to derive an encryption key
2. **Message Encryption**: Each message is encrypted using AES-GCM with a unique IV
3. **Secure Storage**: Only encrypted messages and IVs are stored in Supabase
4. **Client-side Decryption**: Messages are decrypted on your device using your password

## 🗄️ Database Schema

The app uses the following main tables:
- `users` - User accounts with encryption salts
- `rooms` - Chat rooms with encryption flags
- `room_members` - Room membership management
- `messages` - Encrypted messages with IVs
- `user_room_reads` - Read status tracking
- `user_sessions` - Session management

## 🔒 Security Features

- ✅ **End-to-End Encryption** - Messages encrypted client-side
- ✅ **Row Level Security** - Database-level access controls
- ✅ **Secure Key Derivation** - PBKDF2 with 100,000 iterations
- ✅ **Unique IVs** - Each message has a unique initialization vector
- ✅ **No Plain Text Storage** - Only encrypted data in database
- ✅ **Session Management** - Secure session handling

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── messages/      # Message endpoints
│   │   └── rooms/         # Room endpoints
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat-interface.tsx # Main chat component
│   └── login-form.tsx    # Authentication form
├── lib/                  # Utility libraries
│   ├── crypto.ts         # Encryption functions
│   ├── supabase.ts       # Supabase client
│   └── store.ts          # Legacy store (for reference)
└── scripts/              # Database setup scripts
    ├── 01-create-tables-optimized.sql
    ├── 02-enable-rls-optimized.sql
    ├── 03-create-functions-optimized.sql
    └── 04-additional-features.sql
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

This is a demonstration project. For production use, consider:
- Implementing proper password hashing (bcrypt)
- Adding rate limiting
- Implementing proper session management
- Adding message retention policies
- Regular security audits

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Encryption using [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**Remember**: Your encryption password is never stored. If you forget it, your messages cannot be recovered. Keep it safe! 🔐