import { allVisualizations } from "../components/homepage/catalog";

export const SITE_URL = "https://codequest101.vercel.app";

export interface SeoPage {
  path: string;
  title: string;
  description: string;
  index: boolean;
}

export const publicPages: SeoPage[] = [
  {
    path: "/",
    title: "Algorithm & Data Structure Visualizer | CodeQuest101",
    description: "Learn algorithms, data structures, coding interview patterns and machine learning with free interactive visualizations and an AI tutor. No account needed to start.",
    index: true,
  },
  {
    path: "/visualizations",
    title: "Browse Algorithm, DSA & ML Visualizers | CodeQuest101",
    description: "Browse free visualizers for sorting, binary search, linked lists, trees, graphs, interview patterns and machine learning. Explore each topic step by step.",
    index: true,
  },
  {
    path: "/about",
    title: "About CodeQuest101 | Learn Algorithms Visually",
    description: "Meet the developer behind CodeQuest101, a free learning platform for interactive algorithm, data structure and machine learning visualizations.",
    index: true,
  },
  ...allVisualizations.map((viz) => ({
    path: `/visualize/${viz.key}`,
    title: `${viz.seoTitle ?? `${viz.title} Visualizer`} | CodeQuest101`,
    description: viz.description,
    index: true,
  })),
];

export const utilityPages: SeoPage[] = [
  { path: "/chat", title: "AI Coding Tutor", description: "Ask the CodeQuest101 AI tutor about algorithms, data structures and your code." },
  { path: "/login", title: "Log In", description: "Log in to your CodeQuest101 account." },
  { path: "/signup", title: "Create an Account", description: "Create your CodeQuest101 account." },
  { path: "/forgot-password", title: "Reset Password", description: "Reset your CodeQuest101 account password." },
  { path: "/auth/callback", title: "Signing In", description: "Complete your CodeQuest101 sign-in." },
].map((page) => ({ ...page, title: `${page.title} | CodeQuest101`, index: false }));

export function getSeoPage(pathname: string): SeoPage {
  const path = pathname.replace(/\/+$/, "") || "/";
  return [...publicPages, ...utilityPages].find((page) => page.path === path) ?? {
    path,
    title: "Page Not Found | CodeQuest101",
    description: "This page could not be found. Browse CodeQuest101's interactive algorithm and data structure visualizers.",
    index: false,
  };
}
