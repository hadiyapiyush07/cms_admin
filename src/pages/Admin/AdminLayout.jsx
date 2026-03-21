import { NavLink, Outlet, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const navigate = useNavigate();

  const navClass = ({ isActive }) =>
    `p-3 rounded transition-all duration-300
     ${isActive
       ? "bg-blue-700 scale-105 shadow-lg"
       : "hover:bg-blue-700 hover:translate-x-1"}`;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* FIXED SIDEBAR */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col h-screen fixed left-0 top-0">
        <div className="p-5 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-8">
            Admin Panel
          </h2>

          {/* Navigation - removed overflow-y-auto */}
          <nav className="flex flex-col gap-3 flex-grow">
            <NavLink to="/admin" end className={navClass}>
              Profile
            </NavLink>

            <NavLink to="/admin/studentmanagement" className={navClass}>
              Student Management
            </NavLink>

            <NavLink to="/admin/professormanagement" className={navClass}>
              Professor Management
            </NavLink>

            <NavLink to="/admin/handlegallery" className={navClass}>
              Handle Gallery
            </NavLink>

            <NavLink to="/admin/notification" className={navClass}>
              Notification
            </NavLink>
            
          </nav>

          
        </div>
      </aside>

      {/* SCROLLABLE CONTENT AREA - offset for fixed sidebar */}
      <main className="flex-1 ml-64 bg-gray-100 min-h-screen overflow-y-auto">
        <div className="p-8 animate-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;