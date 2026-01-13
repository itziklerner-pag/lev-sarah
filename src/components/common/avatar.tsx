"use client";

import clsx from "clsx";
import { AVATAR_GRADIENTS } from "../../../lib/constants";

interface AvatarProps {
  name: string;
  hebrewName?: string;
  gradient?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

/**
 * Avatar component with gradient background and initials
 * Used for family member identification throughout the app
 */
export function Avatar({
  name,
  hebrewName,
  gradient,
  size = "md",
  showName = false,
  className,
}: AvatarProps) {
  // Get initials - prefer Hebrew name if available
  const displayName = hebrewName || name;
  const initial = displayName.charAt(0);

  // Use provided gradient or generate one from name
  const avatarGradient =
    gradient || getGradientFromName(displayName);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-xl",
    xl: "w-20 h-20 text-3xl",
  };

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div
        className={clsx(
          "flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md",
          avatarGradient,
          sizeClasses[size]
        )}
      >
        {initial}
      </div>
      {showName && (
        <span className="font-hebrew font-medium">{displayName}</span>
      )}
    </div>
  );
}

/**
 * Generate a consistent gradient based on name
 * Same name always gets same color
 */
function getGradientFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * Large avatar for Abba Display
 */
export function LargeAvatar({
  name,
  hebrewName,
  gradient,
}: {
  name: string;
  hebrewName?: string;
  gradient?: string;
}) {
  const displayName = hebrewName || name;
  const avatarGradient = gradient || getGradientFromName(displayName);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={clsx(
          "flex items-center justify-center rounded-full bg-gradient-to-br",
          "w-32 h-32 text-5xl font-bold text-white shadow-xl",
          avatarGradient
        )}
      >
        {displayName.charAt(0)}
      </div>
      <span className="text-3xl font-bold font-hebrew">{displayName}</span>
    </div>
  );
}

/**
 * Avatar group for showing multiple visitors
 */
export function AvatarGroup({
  members,
  max = 4,
}: {
  members: Array<{ name: string; hebrewName?: string; gradient?: string }>;
  max?: number;
}) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex -space-x-2 rtl:space-x-reverse">
      {visible.map((member, index) => (
        <Avatar
          key={index}
          name={member.name}
          hebrewName={member.hebrewName}
          gradient={member.gradient}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
