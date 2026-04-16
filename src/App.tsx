/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { HomeView } from './components/home/HomeView';
import { ExperienceView } from './components/experience/ExperienceView';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'home' | 'experience'>('home');

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HomeView onEnterExperience={() => setView('experience')} />
          </motion.div>
        ) : (
          <motion.div
            key="experience"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ExperienceView onBack={() => setView('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

