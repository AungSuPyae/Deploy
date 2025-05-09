import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOutUser } from '../../../api/authService';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { path: '/adminUI', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/adminUI/UserManagement', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/adminUI/SearchManagement', label: 'Recipe Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' },
  { path: '/adminUI/AssistantChat', label: 'Support Chat', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z' },
  { path: '/adminUI/ChatManagement', label: 'Chat History', icon: 'M7 8h6M7 12h4m5 8l-4-4H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-1l-3 3zM16 2v4m0 0l2-2m-2 2l-2-2' },
  { path: '/adminUI/PostsManagement', label: 'NutriGen Community', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
  const router = useRouter();
  const [isMobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      console.log('Signing out user');
      await signOutUser();
      router.push('/auth/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <LayoutGroup>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <motion.aside
          layout
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="hidden md:flex flex-col w-72 bg-gradient-to-b from-green-50 to-white shadow-lg border-r border-green-100"
        >
          <div className="px-6 py-5 border-b border-green-100 flex items-center space-x-3">
            <svg 
              className="h-8 w-8 text-green-600" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
              NutriGen Admin
            </h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto mt-6 px-3">
            {navItems.map((item, index) => {
              const active = router.pathname === item.path;
              return (
                <Link 
                  href={item.path} 
                  key={item.path}
                  className="block my-1.5"
                >
                  <div
                    className={`flex items-center px-4 py-3 rounded-xl transition duration-200 ${
                      active 
                        ? 'bg-green-100/60 text-green-700 shadow-sm' 
                        : 'text-gray-700 hover:bg-green-50/60'
                    }`}
                  >
                    <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${
                      active ? 'bg-green-100 text-green-600' : 'text-gray-500'
                    }`}>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={active ? 2.2 : 1.8} 
                          d={item.icon} 
                        />
                      </svg>
                    </div>
                    <span className={`ml-3 ${active ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    
                    {active && (
                      <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-400 rounded-full absolute -left-0.5" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="px-4 py-5 border-t border-green-100">
            <div className="mb-4 px-3 py-2 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                  {/* Display admin initial or avatar */}
                  A
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Nutrition Expert</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 rounded-xl text-red-600 font-medium transition duration-200 hover:bg-red-50"
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-lg text-red-500">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="ml-3">Sign Out</span>
            </button>
          </div>
        </motion.aside>

        {/* Mobile Toggler */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 bg-white rounded-lg shadow-lg transition duration-200 hover:bg-gray-50"
          >
            <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 md:hidden z-40"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-green-50 to-white shadow-xl md:hidden"
              >
                <div className="px-6 py-5 border-b border-green-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <svg 
                      className="h-7 w-7 text-green-600" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                      NutriGen
                    </h2>
                  </div>
                  <button 
                    onClick={() => setMobileOpen(false)} 
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition duration-200"
                  >
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <nav className="mt-5 px-3">
                  {navItems.map((item, index) => {
                    const active = router.pathname === item.path;
                    return (
                      <Link 
                        href={item.path} 
                        key={item.path}
                        className="block my-1"
                        onClick={() => setMobileOpen(false)}
                      >
                        <div
                          className={`flex items-center px-4 py-3 rounded-xl transition duration-200 ${
                            active 
                              ? 'bg-green-100/60 text-green-700 shadow-sm' 
                              : 'text-gray-700 hover:bg-green-50/60'
                          }`}
                        >
                          <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                            active ? 'bg-green-100 text-green-600' : 'text-gray-500'
                          }`}>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={active ? 2.2 : 1.8} 
                                d={item.icon} 
                              />
                            </svg>
                          </div>
                          <span className={`ml-3 ${active ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                          
                          {active && (
                            <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-400 rounded-full absolute -left-0.5" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="absolute bottom-0 w-full px-4 py-5 border-t border-green-100">
                  <div className="mb-4 px-3 py-2 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                        A
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-500">Nutrition Expert</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-red-600 font-medium transition duration-200 hover:bg-red-50"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg text-red-500">
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="ml-3">Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-auto">
          <header className="bg-white shadow-sm px-8 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          </header>
          <main className="flex-1 p-8 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>
    </LayoutGroup>
  );
};

export default AdminLayout;

