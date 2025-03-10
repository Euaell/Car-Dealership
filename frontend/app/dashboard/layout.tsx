'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiCar, 
  FiUsers, 
  FiTruck, 
  FiShoppingCart, 
  FiCalendar, 
  FiSettings, 
  FiBarChart2,
  FiMenu,
  FiX
} from 'react-icons/fi';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  title: string;
  isActive: boolean;
}

const NavItem = ({ href, icon, title, isActive }: NavItemProps) => (
  <Link
    href={href}
    className={`flex items-center p-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-indigo-700 text-white' 
        : 'text-gray-300 hover:bg-indigo-800 hover:text-white'
    }`}
  >
    <span className="mr-3 text-xl">{icon}</span>
    <span className="font-medium">{title}</span>
  </Link>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: <FiHome />, title: 'Dashboard' },
    { href: '/dashboard/cars', icon: <FiCar />, title: 'Cars' },
    { href: '/dashboard/spare-parts', icon: <FiTruck />, title: 'Spare Parts' },
    { href: '/dashboard/customers', icon: <FiUsers />, title: 'Customers' },
    { href: '/dashboard/orders', icon: <FiShoppingCart />, title: 'Orders' },
    { href: '/dashboard/services', icon: <FiCalendar />, title: 'Services' },
    { href: '/dashboard/reports', icon: <FiBarChart2 />, title: 'Reports' },
    { href: '/dashboard/settings', icon: <FiSettings />, title: 'Settings' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-indigo-900 transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-800">
          <Link href="/dashboard" className="text-white text-xl font-bold">
            Car Dealership
          </Link>
          <button 
            className="text-white lg:hidden"
            onClick={toggleSidebar}
          >
            <FiX size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button 
              className="text-gray-600 lg:hidden"
              onClick={toggleSidebar}
            >
              <FiMenu size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {/* Notification icon would go here */}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  A
                </div>
                <span className="text-gray-700 font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 