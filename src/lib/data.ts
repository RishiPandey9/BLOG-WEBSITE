import { BlogPost, Category } from '@/types';

export const categories: Category[] = [
  { id: '1', name: 'Technology', slug: 'technology', color: 'blue', icon: '💻', postCount: 12 },
  { id: '2', name: 'Design', slug: 'design', color: 'purple', icon: '🎨', postCount: 8 },
  { id: '3', name: 'Tutorial', slug: 'tutorial', color: 'green', icon: '📚', postCount: 15 },
  { id: '4', name: 'Career', slug: 'career', color: 'orange', icon: '🚀', postCount: 6 },
  { id: '5', name: 'Lifestyle', slug: 'lifestyle', color: 'pink', icon: '✨', postCount: 9 },
  { id: '6', name: 'AI & ML', slug: 'ai-ml', color: 'cyan', icon: '🤖', postCount: 11 },
];

export const posts: BlogPost[] = [
  {
    id: '1',
    slug: 'getting-started-with-nextjs-14',
    title: 'Getting Started with Next.js 14: A Complete Guide',
    excerpt: 'Explore the powerful new features in Next.js 14 including Server Actions, Partial Prerendering, and the improved App Router. Learn how to build fast, scalable web applications.',
    content: `# Getting Started with Next.js 14

Next.js 14 brings exciting new features that make building web applications faster and more efficient than ever before.

## What's New in Next.js 14

### Server Actions (Stable)
Server Actions allow you to run server-side code directly from your components. This eliminates the need for separate API routes for many use cases.

\`\`\`typescript
'use server'

async function createPost(formData: FormData) {
  const title = formData.get('title')
  // Save to database
  await db.post.create({ data: { title } })
  revalidatePath('/posts')
}
\`\`\`

### Partial Prerendering (Preview)
Partial Prerendering is a new rendering model that allows you to combine static and dynamic content in the same route.

### Improved Metadata API
The metadata API has been improved with better TypeScript support and new options for controlling how your pages appear in search results and social media.

## Setting Up Your Project

To create a new Next.js 14 project, run:

\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

Follow the prompts to configure TypeScript, ESLint, Tailwind CSS, and the App Router.

## App Router Best Practices

1. **Use Server Components by default** - Only add 'use client' when needed
2. **Leverage caching** - Understand the different caching mechanisms
3. **Optimize images** - Always use the next/image component
4. **Handle loading states** - Use loading.tsx files for streaming

## Conclusion

Next.js 14 is a significant release that makes it easier than ever to build production-ready web applications. The stable Server Actions, improved performance, and developer experience improvements make it a great choice for your next project.`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
    category: 'Technology',
    tags: ['Next.js', 'React', 'TypeScript', 'Web Development'],
    author: {
      name: 'Alex Johnson',
      username: 'alexj',
      email: 'alex@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
      bio: 'Full-stack developer passionate about React and Next.js',
    },
    publishedAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    readingTime: 8,
    likes: 142,
    views: 3420,
    commentCount: 24,
    featured: true,
    status: 'published' as const,
  },
  {
    id: '2',
    slug: 'mastering-tailwind-css-design-system',
    title: 'Mastering Tailwind CSS: Building a Design System',
    excerpt: 'Learn how to create a consistent and scalable design system using Tailwind CSS. From color palettes to component patterns, discover the power of utility-first CSS.',
    content: `# Mastering Tailwind CSS: Building a Design System

Tailwind CSS has revolutionized how developers approach styling. Let's explore how to build a robust design system.

## Setting Up Your Design Tokens

Design tokens are the foundation of any good design system. In Tailwind, these live in your \`tailwind.config.ts\`.

\`\`\`typescript
const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        }
      }
    }
  }
}
\`\`\`

## Component Patterns

### The Button Component

\`\`\`tsx
const Button = ({ variant = 'primary', children }) => {
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    ghost: 'hover:bg-gray-100 text-gray-700',
  }
  
  return (
    <button className={\`px-4 py-2 rounded-lg font-medium transition-colors \${variants[variant]}\`}>
      {children}
    </button>
  )
}
\`\`\`

## Dark Mode Strategy

Tailwind's dark mode with the \`class\` strategy gives you full control over when dark mode is applied.

## Conclusion

Building a design system with Tailwind CSS gives you the perfect balance between consistency and flexibility. Your team will be more productive and your app will look more polished.`,
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60',
    category: 'Design',
    tags: ['Tailwind CSS', 'Design System', 'CSS', 'Frontend'],
    author: {
      name: 'Sarah Chen',
      username: 'sarahc',
      email: 'sarah@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
      bio: 'UI/UX Engineer specializing in design systems',
    },
    publishedAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-12T11:00:00Z',
    readingTime: 10,
    likes: 98,
    views: 2150,
    commentCount: 15,
    featured: true,
    status: 'published' as const,
  },
  {
    id: '3',
    slug: 'building-rest-api-with-nodejs',
    title: 'Building a Production-Ready REST API with Node.js',
    excerpt: 'Step-by-step guide to building a robust REST API using Node.js, Express, and TypeScript. Includes authentication, validation, error handling, and deployment.',
    content: `# Building a Production-Ready REST API with Node.js

## Project Setup

First, let's initialize our project with the right tools and configurations.

\`\`\`bash
mkdir my-api && cd my-api
npm init -y
npm install express typescript ts-node
npm install -D @types/express @types/node
\`\`\`

## Application Structure

A well-organized structure is key to maintainability:

\`\`\`
src/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  app.ts
  server.ts
\`\`\`

## Authentication with JWT

Secure your endpoints with JSON Web Tokens.

## Input Validation

Use Zod or Joi for robust input validation.

## Error Handling

A centralized error handler makes your API predictable and easy to debug.

## Conclusion

Following these patterns will give you a solid foundation for any production API.`,
    coverImage: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=800&auto=format&fit=crop&q=60',
    category: 'Tutorial',
    tags: ['Node.js', 'REST API', 'TypeScript', 'Backend'],
    author: {
      name: 'Marcus Williams',
      username: 'marcusw',
      email: 'marcus@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
      bio: 'Backend engineer with 8 years of experience',
    },
    publishedAt: '2024-03-08T14:00:00Z',
    updatedAt: '2024-03-08T14:00:00Z',
    readingTime: 15,
    likes: 203,
    views: 4820,
    commentCount: 31,
    featured: false,
    status: 'published' as const,
  },
  {
    id: '4',
    slug: 'machine-learning-for-developers',
    title: 'Machine Learning for Web Developers: A Practical Introduction',
    excerpt: 'Demystify machine learning for web developers. Learn how to integrate ML models into your web apps using TensorFlow.js and Hugging Face APIs without a data science background.',
    content: `# Machine Learning for Web Developers

As a web developer, you don't need to be a data scientist to leverage machine learning in your applications.

## Getting Started with TensorFlow.js

TensorFlow.js brings machine learning directly to the browser.

\`\`\`javascript
import * as tf from '@tensorflow/tfjs'

// Load a pre-trained model
const model = await tf.loadLayersModel('/model/model.json')

// Make a prediction
const input = tf.tensor2d([[1, 2, 3, 4]])
const prediction = model.predict(input)
\`\`\`

## Using Hugging Face APIs

Hugging Face provides easy access to thousands of pre-trained models.

## Practical Use Cases

1. **Image classification** - Identify objects in photos
2. **Sentiment analysis** - Understand user feedback
3. **Text generation** - Auto-complete and content generation
4. **Translation** - Multi-language support
5. **Voice recognition** - Command interfaces

## Conclusion

Machine learning is now accessible to every web developer. Start with pre-trained models and APIs before diving into training your own.`,
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=60',
    category: 'AI & ML',
    tags: ['Machine Learning', 'TensorFlow.js', 'AI', 'JavaScript'],
    author: {
      name: 'Priya Patel',
      username: 'priyap',
      email: 'priya@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
      bio: 'ML engineer turned web developer',
    },
    publishedAt: '2024-03-05T11:00:00Z',
    updatedAt: '2024-03-06T09:00:00Z',
    readingTime: 12,
    likes: 312,
    views: 6730,
    commentCount: 48,
    featured: true,
    status: 'published' as const,
  },
  {
    id: '5',
    slug: 'remote-work-developer-productivity',
    title: '10 Proven Strategies to Boost Developer Productivity When Working Remotely',
    excerpt: 'Working from home as a developer can be challenging. Discover the strategies, tools, and habits that top developers use to stay productive and maintain work-life balance.',
    content: `# 10 Proven Strategies to Boost Developer Productivity

Remote work has become the norm for many developers. Here's how to thrive in this environment.

## 1. Design Your Workspace

Your physical environment significantly impacts your productivity. Invest in:
- A quality monitor (or two!)
- An ergonomic chair
- Good lighting
- Noise-canceling headphones

## 2. Establish Clear Boundaries

Set specific working hours and communicate them to your household. When work time is over, truly disconnect.

## 3. Use the Pomodoro Technique

Work in focused 25-minute sprints with 5-minute breaks. Every 4 pomodoros, take a longer 15-30 minute break.

## 4. Async-First Communication

Embrace asynchronous communication tools:
- Loom for video updates
- Linear for project management
- Notion for documentation

## 5. Daily Standups (With Yourself)

Start each day by writing down your top 3 priorities. End each day with a brief review.

## Conclusion

Remote work productivity is a skill you can develop. Start with a few of these strategies and build from there.`,
    coverImage: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop&q=60',
    category: 'Career',
    tags: ['Remote Work', 'Productivity', 'Career', 'Work-Life Balance'],
    author: {
      name: 'Jordan Lee',
      username: 'jordanl',
      email: 'jordan@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      bio: 'Developer advocate and remote work enthusiast',
    },
    publishedAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
    readingTime: 7,
    likes: 189,
    views: 5210,
    commentCount: 22,
    featured: false,
    status: 'published' as const,
  },
  {
    id: '6',
    slug: 'react-performance-optimization',
    title: 'React Performance Optimization: From Slow to Blazing Fast',
    excerpt: 'Deep dive into React performance optimization techniques. Learn about memoization, code splitting, lazy loading, and profiling to make your React apps significantly faster.',
    content: `# React Performance Optimization

Performance is crucial for user experience. Let's explore techniques to make your React apps blazing fast.

## Understanding Re-renders

React re-renders a component when its state or props change. Unnecessary re-renders are the most common performance issue.

## Memoization

### React.memo

Wrap components that receive the same props frequently:

\`\`\`tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>
})
\`\`\`

### useMemo and useCallback

\`\`\`tsx
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data])
const handleClick = useCallback(() => doSomething(id), [id])
\`\`\`

## Code Splitting

Split your bundle to load only what's needed:

\`\`\`tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
\`\`\`

## Virtual Lists

For long lists, use virtualization:

\`\`\`bash
npm install @tanstack/react-virtual
\`\`\`

## Profiling Your App

Use React DevTools Profiler to identify bottlenecks.

## Conclusion

Performance optimization is an ongoing process. Measure first, then optimize based on real data.`,
    coverImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=60',
    category: 'Technology',
    tags: ['React', 'Performance', 'Optimization', 'JavaScript'],
    author: {
      name: 'Alex Johnson',
      username: 'alexj',
      email: 'alex@devblog.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
      bio: 'Full-stack developer passionate about React and Next.js',
    },
    publishedAt: '2024-02-28T16:00:00Z',
    updatedAt: '2024-02-29T10:00:00Z',
    readingTime: 11,
    likes: 267,
    views: 5890,
    commentCount: 37,
    featured: false,
    status: 'published' as const,
  },
];
