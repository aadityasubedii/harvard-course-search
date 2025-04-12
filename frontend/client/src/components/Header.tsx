import { Link } from "wouter";

export default function Header() {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L5 9v6l7 3.5 7-3.5V9l-7-4.5z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <h1 className="text-lg font-display font-semibold text-neutral-800">
              <Link href="/">
                Harvard<span className="text-primary">CourseGPT</span>
              </Link>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-neutral-600 hover:text-primary transition-colors duration-200 text-sm font-medium">
              Home
            </Link>
            <Link href="/saved" className="text-neutral-600 hover:text-primary transition-colors duration-200 text-sm font-medium">
              Saved Courses
            </Link>
            <Link href="/about" className="text-neutral-600 hover:text-primary transition-colors duration-200 text-sm font-medium">
              About
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <button 
              className="p-2 rounded-md text-neutral-500 hover:text-primary hover:bg-neutral-100 transition-colors duration-200 md:hidden"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            <button className="hidden md:flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-all duration-200 harvard-shadow">
              Sign in with Harvard
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
