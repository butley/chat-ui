import { DefaultSession } from "next-auth";
import { useState } from 'react';
import { PortalUser } from "@/types/custom";

interface Props {

}

export function UserCard({ user, onLogout }: { user: PortalUser; onLogout: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  return (
      <div className="relative inline-block text-left flex items-center">
        <button
            onClick={toggleDropdown}
            className="text-sm focus:outline-none mr-2"
        >
          {user.firstName}
        </button>
        <img
            className="h-8 w-8 object-cover rounded-full mr-2"
            src={user.picture}
            alt={`${user.firstName}'s profile`}
        />
        {dropdownOpen && (
            <div className="absolute bg-gray-700 right-0 top-full w-48 py-1 rounded-md border border-white p-3 text-[12.5px] text-white leading-3 text-white focus:outline-none">
              <a
                  href="/settings"
                  className="block px-4 py-2 text-sm hover:bg-gray-800 focus:outline-none"
              >
                Settings
              </a>
              <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 focus:outline-none"
              >
                Logout
              </button>
            </div>
        )}
      </div>
  );
}
