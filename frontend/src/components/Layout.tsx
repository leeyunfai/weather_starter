import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { ThemeSelector } from './ThemeSelector';

export function Layout() {
  return (
    <div className="flex h-full min-h-screen w-full">
      <Sidebar />
      <div className="relative flex flex-1 flex-col">
        <div className="absolute right-4 top-4 z-10">
          <ThemeSelector />
        </div>
        <Hero />
      </div>
    </div>
  );
}
