import React from "react";
import { useNavigate } from "react-router-dom";

import { HeroSection } from '../components/homepage/HeroSection';
import { AiTutorSection } from '../components/homepage/AiTutorSection';
import { VisualizationSection } from '../components/homepage/VisualizationSection';
import { AboutSection } from '../components/homepage/AboutSection';
import { CallToActionSection } from '../components/homepage/CallToActionSection';

import Header from "../components/Header";
import Footer from "../components/Footer";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectVisualization = (key: string) => {
    navigate(`/visualize/${key}`);
  };

  return (
    // No background here: index.css paints the page (and two fixed radial
    // gradients that give continuity across sections). An opaque fill at this
    // level covered them, which is why every section boundary showed a band.
    // w-full, not w-screen — 100vw includes the scrollbar gutter.
    <div className="flex min-h-screen w-full flex-col">
      <Header />

      <main className="w-full flex-grow">
        <HeroSection />
        <AiTutorSection />
        <VisualizationSection onSelectVisualization={handleSelectVisualization} />
        <AboutSection />
        <CallToActionSection />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;