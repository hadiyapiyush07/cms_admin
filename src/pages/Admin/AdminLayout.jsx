import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, Image,
  Bell, BookOpen, CreditCard, Menu, X, ChevronRight
} from "lucide-react";

const navItems = [
  { to: "/admin",                    end: true,  icon: LayoutDashboard, label: "Profile"              },
  { to: "/admin/studentmanagement",  end: false, icon: Users,           label: "Student Management"   },
  { to: "/admin/professormanagement",end: false, icon: GraduationCap,   label: "Professor Management" },
  { to: "/admin/handlegallery",      end: false, icon: Image,           label: "Handle Gallery"       },
  { to: "/admin/notification",       end: false, icon: Bell,            label: "Notification"         },
  { to: "/admin/subject",            end: false, icon: BookOpen,        label: "Manage Subject"       },
  { to: "/admin/fees",               end: false, icon: CreditCard,      label: "Fees Status"          },
];

const AdminLayout = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const [open, setOpen] = useState(false);
  const sidebarRef  = useRef(null);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
     ${isActive
       ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
       : "text-blue-100 hover:bg-white/10 hover:text-white"}`;

  const Sidebar = () => (
    <aside
      ref={sidebarRef}
      className={`
        fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-950
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        shadow-2xl
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none
      `}
    >
      {/* Logo / Brand */}
      <div className="px-5 py-6 border-b border-blue-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Campus Flow</h2>
              <p className="text-blue-300 text-xs">Admin Panel</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-blue-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end} className={navClass}>
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-white" : "text-blue-300 group-hover:text-white"} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-300" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-blue-800/50">
        <p className="text-blue-400 text-xs text-center">© 2025 Campus Flow</p>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar + Overlay */}
      <div className="lg:hidden">
        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
        )}
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar — mobile only */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">CF</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">Campus Flow</span>
          </div>
          {/* Current page label */}
          <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {navItems.find(n => n.end
              ? location.pathname === n.to
              : location.pathname.startsWith(n.to))?.label || 'Admin'}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;