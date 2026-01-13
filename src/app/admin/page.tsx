"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import clsx from "clsx";

const RELATIONSHIPS = [
  { value: "בן", label: "בן" },
  { value: "בת", label: "בת" },
  { value: "נכד", label: "נכד" },
  { value: "נכדה", label: "נכדה" },
  { value: "נינה", label: "נינה" },
  { value: "קרוב", label: "קרוב" },
  { value: "קרובה", label: "קרובה" },
] as const;

type Relationship = (typeof RELATIONSHIPS)[number]["value"];

export default function AdminPage() {
  const isAdmin = useQuery(api.admin.isAdmin);
  const users = useQuery(api.admin.getUsers);
  const invites = useQuery(api.admin.getInvites);

  const createInvite = useMutation(api.admin.createInvite);
  const sendInvite = useAction(api.admin.sendInvite);
  const setAdmin = useMutation(api.admin.setAdmin);
  const deleteUser = useMutation(api.admin.deleteUser);
  const deleteInvite = useMutation(api.admin.deleteInvite);
  const resendInvite = useMutation(api.admin.resendInvite);

  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    phone: "",
    relationship: "בן" as Relationship,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">גישה מוגבלת</h1>
          <p className="text-gray-600">עמוד זה זמין למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const inviteId = await createInvite({
        name: inviteForm.name,
        phone: inviteForm.phone,
        relationship: inviteForm.relationship,
      });

      // Send WhatsApp invite
      await sendInvite({ inviteId });

      setInviteForm({ name: "", phone: "", relationship: "בן" });
      setShowInviteForm(false);
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת ההזמנה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (inviteId: Id<"invites">) => {
    try {
      await resendInvite({ inviteId });
      await sendInvite({ inviteId });
    } catch (err: any) {
      alert(err.message || "שגיאה בשליחה מחדש");
    }
  };

  const handleToggleAdmin = async (profileId: Id<"familyProfiles">, currentIsAdmin: boolean) => {
    try {
      await setAdmin({ profileId, isAdmin: !currentIsAdmin });
    } catch (err: any) {
      alert(err.message || "שגיאה בעדכון הרשאות");
    }
  };

  const handleDeleteUser = async (profileId: Id<"familyProfiles">, name: string) => {
    if (!confirm(`האם למחוק את ${name}?`)) return;
    try {
      await deleteUser({ profileId });
    } catch (err: any) {
      alert(err.message || "שגיאה במחיקה");
    }
  };

  const handleDeleteInvite = async (inviteId: Id<"invites">) => {
    if (!confirm("האם למחוק הזמנה זו?")) return;
    try {
      await deleteInvite({ inviteId });
    } catch (err: any) {
      alert(err.message || "שגיאה במחיקה");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">ניהול המערכת</h1>
          <p className="text-sm text-gray-500">ניהול משתמשים והזמנות</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            משתמשים ({users?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "invites"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            הזמנות ({invites?.length || 0})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <section className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">משתמשים רשומים</h2>
            </div>

            {users === undefined ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                אין משתמשים רשומים עדיין
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.relationship} | {user.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.profileCompleted ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          פרופיל מלא
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          ללא תמונה
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                        className={clsx(
                          "text-xs px-3 py-1 rounded-lg transition-colors",
                          user.isAdmin
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {user.isAdmin ? "מנהל" : "הפוך למנהל"}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <section className="space-y-4">
            {/* Add Invite Button */}
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              + הוסף הזמנה חדשה
            </button>

            {/* Invite Form Modal */}
            {showInviteForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4">הזמנת בן משפחה</h3>

                  <form onSubmit={handleCreateInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        שם מלא
                      </label>
                      <input
                        type="text"
                        value={inviteForm.name}
                        onChange={(e) =>
                          setInviteForm({ ...inviteForm, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ישראל ישראלי"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        מספר טלפון
                      </label>
                      <input
                        type="tel"
                        value={inviteForm.phone}
                        onChange={(e) =>
                          setInviteForm({ ...inviteForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                        dir="ltr"
                        placeholder="050-123-4567"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        קרבה
                      </label>
                      <select
                        value={inviteForm.relationship}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            relationship: e.target.value as Relationship,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel.value} value={rel.value}>
                            {rel.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "שולח..." : "שלח הזמנה"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInviteForm(false);
                          setError(null);
                        }}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Invites List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">הזמנות</h2>
              </div>

              {invites === undefined ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : !invites || invites.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  אין הזמנות ממתינות
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {invites.map((invite) => (
                    <div
                      key={invite._id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{invite.name}</div>
                        <div className="text-sm text-gray-500">
                          {invite.relationship} | {invite.phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(invite.invitedAt).toLocaleDateString("he-IL")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "text-xs px-2 py-1 rounded-full",
                            invite.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : invite.status === "sent"
                              ? "bg-blue-100 text-blue-700"
                              : invite.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {invite.status === "accepted"
                            ? "התקבל"
                            : invite.status === "sent"
                            ? "נשלח"
                            : invite.status === "failed"
                            ? "נכשל"
                            : "ממתין"}
                        </span>

                        {(invite.status === "failed" || invite.status === "pending") && (
                          <button
                            onClick={() => handleResendInvite(invite._id)}
                            className="text-xs px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            שלח שוב
                          </button>
                        )}

                        {invite.status !== "accepted" && (
                          <button
                            onClick={() => handleDeleteInvite(invite._id)}
                            className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            מחק
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
