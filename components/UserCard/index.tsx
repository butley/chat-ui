import { DefaultSession } from "next-auth";
import { useState } from 'react';

interface Props {

}

export function UserCard({ user, onLogout }: { user: DefaultSession['user']; onLogout: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
      <div className="relative inline-block text-left flex items-center">
        <button
            onClick={toggleDropdown}
            className="text-sm font-semibold focus:outline-none mr-2"
        >
          {user?.name}
        </button>
        <img
            className="h-8 w-8 object-cover rounded-full mr-2"
            src={user?.image}
            alt={`${user?.name}'s profile`}
        />
        {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 py-1 bg-white shadow-lg rounded-md text-black ring-1 ring-black ring-opacity-5 focus:outline-none">
              <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                Logout
              </button>
            </div>
        )}
      </div>
  );
}
