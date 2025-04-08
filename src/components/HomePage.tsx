// pages/HomePage.tsx (or wherever your original file is)
import React from "react";

// Import the section components
import { HeroSection } from '../components/homepage/HeroSection';
import { AiTutorSection } from '../components/homepage/AiTutorSection';
import { VisualizationSection } from '../components/homepage/VisualizationSection';
import { AboutSection } from '../components/homepage/AboutSection';
import { CallToActionSection } from '../components/homepage/CallToActionSection';

// Import shared Header and Footer
import Header from "../components/Header"; // Adjust path if needed
import Footer from "../components/Footer"; // Adjust path if needed

interface HomePageProps {
  // This prop likely needs to be passed down from a higher-level component
  // that handles routing or main application state.
  onSelectVisualization: (key: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectVisualization }) => {
  return (
    // Apply base dark theme styles to the root container
    <div className="min-h-screen flex flex-col w-screen bg-gray-950">
      {/* Assume Header component is adapted for dark theme */}
      <Header />

      <main className="flex-grow w-full"> {/* Changed flex-groww-screen to flex-grow w-full */}
        <HeroSection />
        <AiTutorSection />
        {/* Pass the handler down to the Visualization section */}
        <VisualizationSection onSelectVisualization={onSelectVisualization} />
        <AboutSection />
        <CallToActionSection />
        {/* Removed Contributors section as it was commented out */}
      </main>

      {/* Assume Footer component is adapted for dark theme */}
      <Footer />
    </div>
  );
};

export default HomePage;