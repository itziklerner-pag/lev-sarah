"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

interface UserMenuProps {
  name: string;
  imageUrl?: string | null;
  onProfileClick?: () => void;
}

export function UserMenu({ name, imageUrl, onProfileClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuthActions();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    onProfileClick?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-label="תפריט משתמש"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm"
            title="הוסף תמונה"
          >
            {name.charAt(0)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          </div>

          <button
            onClick={handleProfileClick}
            className="w-full text-right rtl:text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            עדכון תמונה
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-right rtl:text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            התנתקות
          </button>
        </div>
      )}
    </div>
  );
}
