import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ShoppingCart, FileText,
  Users, LogOut, ChevronDown, ChevronRight, AlertCircle, Globe, Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  badge?: string;
  children?: { label: string; to: string; badge?: string; roles?: UserRole[] }[];
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label:'Dashboard', icon:<LayoutDashboard size={17} />, to:'/dashboard' },
  {
    label:'Catalogue', icon:<BookOpen size={17} />, roles:['admin'],
    children:[
      { label:'Browse Catalogue',  to:'/catalogue' },
      { label:'Add Item',          to:'/catalogue/add' },
      { label:'Low Stock Report',  to:'/catalogue/low-stock' },
    ],
  },
  {
    label:'Orders', icon:<ShoppingCart size={17} />,
    children:[
      { label:'All Orders',       to:'/orders' },
      { label:'Place Order',      to:'/orders/new' },
      { label:'Invoices',         to:'/orders/invoices' },
      { label:'Merchant Balances',    to:'/orders/balance',            roles:['admin','manager','clerk'] },
      { label:'Payment Records',      to:'/orders/payments',           roles:['admin','manager','clerk'] },
      { label:'Debtor Reminders',     to:'/orders/reminders',          roles:['admin','manager'] },
      { label:'Monthly Discounts',    to:'/orders/monthly-discounts',  roles:['admin','manager'] },
    ],
  },
  {
    label:'Accounts', icon:<Users size={17} />, roles:['admin','manager'],
    children:[
      { label:'Merchant Accounts', to:'/accounts' },
      { label:'Create Account',    to:'/accounts/new' },
      { label:'User Management',   to:'/accounts/users' },
      { label:'PU Applications',   to:'/accounts/pu-apps', badge:'new' },
    ],
  },
  {
    label:'Reports', icon:<FileText size={17} />, roles:['admin','manager'],
    children:[
      { label:'Turnover Report',        to:'/reports/turnover' },
      { label:'Merchant Summary',       to:'/reports/merchant-summary' },
      { label:'Merchant Detailed',      to:'/reports/merchant-detailed' },
      { label:'Stock Turnover',         to:'/reports/stock-turnover' },
      { label:'Invoice Reports',        to:'/reports/invoices' },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const { hasRole } = useAuth();
  const visibleChildren = (item.children ?? []).filter(c => !c.roles || hasRole(...c.roles));
  return (
    <div>
      <button onClick={() => setOpen(v => !v)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px',
          background:'none', border:'none', cursor:'pointer', color:'var(--color-sidebar-txt)',
          fontSize:'13px', fontFamily:'var(--font-ui)', fontWeight:500, borderRadius:'var(--radius-sm)',
          transition:'color .15s, background .15s', textAlign:'left' }}
        onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.color='#fff'; (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.06)'; }}
        onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.color='var(--color-sidebar-txt)'; (e.currentTarget as HTMLButtonElement).style.background='none'; }}
      >
        <span style={{flexShrink:0}}>{item.icon}</span>
        <span style={{flex:1}}>{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && visibleChildren.length > 0 && (
        <div style={{ paddingLeft:'34px', paddingBottom:'4px' }}>
          {visibleChildren.map(child => (
            <NavLink key={child.to} to={child.to}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'7px 10px', fontSize:'12.5px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'var(--color-sidebar-txt)',
                textDecoration:'none', borderRadius:'var(--radius-sm)',
                background: isActive ? 'rgba(14,165,233,.25)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition:'all .12s',
              })}
            >
              {child.label}
              {child.badge && (
                <span style={{ fontSize:'9px', fontWeight:700, background:'var(--color-primary)', color:'#fff',
                  padding:'1px 5px', borderRadius:'99px', textTransform:'uppercase', letterSpacing:'.04em' }}>
                  {child.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const visibleItems = NAV_ITEMS.filter(item => !item.roles || hasRole(...item.roles));

  return (
    <aside style={{ width:'var(--sidebar-w)', minHeight:'100vh', background:'var(--color-sidebar-bg)',
      display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0 }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:36, height:36, background:'var(--color-primary)', borderRadius:'var(--radius-sm)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0 }}>
            IP
          </div>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:'13px', lineHeight:1.2 }}>InfoPharma</p>
            <p style={{ color:'var(--color-sidebar-txt)', fontSize:'10px', letterSpacing:'.06em', textTransform:'uppercase' }}>IPOS-SA</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' }}>
        {visibleItems.map(item =>
          item.to ? (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px',
                fontSize:'13px', fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'var(--color-sidebar-txt)',
                textDecoration:'none', borderRadius:'var(--radius-sm)',
                background: isActive ? 'rgba(14,165,233,.2)' : 'transparent',
                transition:'all .12s',
              })}
            >
              {item.icon}{item.label}
            </NavLink>
          ) : (
            <NavGroup key={item.label} item={item} />
          )
        )}
      </nav>

      {/* User */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(14,165,233,.25)',
            border:'1px solid rgba(14,165,233,.4)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'12px', fontWeight:700, color:'var(--color-primary)', flexShrink:0 }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow:'hidden' }}>
            <p style={{ color:'#fff', fontSize:'12px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.username}
            </p>
            <p style={{ color:'var(--color-sidebar-txt)', fontSize:'11px', textTransform:'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px',
            background:'rgba(239,68,68,.1)', border:'none', borderRadius:'var(--radius-sm)',
            cursor:'pointer', color:'#f87171', fontSize:'12px', fontFamily:'var(--font-ui)', fontWeight:600 }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
