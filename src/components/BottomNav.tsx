import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: 'dashboard', label: 'Panel' },
  { to: '/admin/network', icon: 'hub', label: 'Red' },
  { to: '/admin/geography', icon: 'map', label: 'Geo' },
  { to: '/admin/users', icon: 'database', label: 'Datos' },
  { to: '/admin/settings', icon: 'settings', label: 'Ajustes' },
];

export default function BottomNav() {
  const { isSuperAdmin } = useAuth();

  const items = isSuperAdmin()
    ? [...navItems.slice(0, 4), { to: '/admin/admins', icon: 'manage_accounts', label: 'Admins' }, navItems[4]]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#e9e3cd] px-1 pb-5 pt-2 flex justify-around items-end z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => clsx('flex flex-col items-center gap-1 group', isActive ? 'text-[#1e1e1e]' : 'text-[#717171]')}
        >
          {({ isActive }) => (
            <>
              <div className={clsx('size-10 flex items-center justify-center rounded-xl transition-all duration-150', isActive ? 'bg-[#fdd13f] text-[#1e1e1e] shadow-sm shadow-[#fdd13f]/50' : 'text-[#717171] group-hover:bg-[#fdd13f]/15')}>
                <span className={clsx('material-symbols-outlined text-[22px]', isActive && 'fill-1')}>{item.icon}</span>
              </div>
              <span className={clsx('text-[10px] font-medium transition-all', isActive ? 'font-bold text-[#1e1e1e]' : 'text-[#717171]')}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
