# CodeQuest: Interactive Algorithm Visualizations

![CodeQuest Logo](https://via.placeholder.com/150)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Akm592/CodeQuest.svg)](https://github.com/Akm592/CodeQuest/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Akm592/CodeQuest.svg)](https://github.com/Akm592/CodeQuest/issues)

## 🚀 Welcome to CodeQuest

Embark on an interactive journey through popular coding challenges and algorithmic visualizations.

## 📚 About CodeQuest

CodeQuest is an innovative platform designed to help developers master complex algorithms and data structures through interactive visualizations. Our mission is to make learning engaging, intuitive, and accessible to coders of all levels.

### 🌟 Key Features

- **Interactive Visualizations**: Experience algorithms in action with our dynamic, step-by-step visualizations.
- **Popular Coding Challenges**: Practice with a curated selection of frequently asked interview questions.
- **Graph Algorithm Visualizer**: Dive deep into graph theory with our specialized graph algorithm tool.
- **Mobile Responsive**: Learn on-the-go with our mobile-friendly interface.
- **Comprehensive Explanations**: Each problem comes with detailed explanations and LeetCode links for further practice.

## 🛠️ Using CodeQuest

1. Visit [CodeQuest Website](https://codequest101.vercel.app/)
2. Browse through our collection of algorithm visualizations
3. Select a problem to start your interactive learning experience
4. Use the step-by-step controls to understand the algorithm's flow
5. Read the accompanying explanations for deeper insights

You can use the AI tutor without an account. Signing in saves your chat
history; guests get an ephemeral session and a usage limit.

## 💻 Running locally

Requires Node.js 20+ and a running instance of
[CodeQuest_Backend](https://github.com/Akm592/CodeQuest_Backend).

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend (defaults to `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

The anon key is meant to be public — it ships in the built bundle. Row Level
Security is what protects user data, so the backend repo's
`supabase/migrations` must be applied to your Supabase project before signing
in does anything useful.

### Checks

```bash
npx tsc -b      # typecheck
npm run lint    # eslint
npm run build   # production build
```

These are the same three steps CI runs.



## 🤝 Contributing

We welcome contributions from the community! If you'd like to contribute, please:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

For more details, check out our [Contributing Guidelines](https://github.com/Akm592/CodeQuest/blob/main/CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Akm592/CodeQuest/blob/main/LICENSE) file for details.

## 📞 Contact Us

Have questions or suggestions? Reach out to us:

- GitHub Issues: [Report a bug or request a feature](https://github.com/Akm592/CodeQuest/issues)

---

Happy Coding with CodeQuest! 🚀👨‍💻👩‍💻

