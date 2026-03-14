import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Briefcase, 
  Calendar, 
  Edit3, 
  Camera, 
  Shield, 
  Key, 
  Globe, 
  Save, 
  X 
} from 'lucide-react';
import { useToast } from "../context/ToastContext";
import { Card, Button, Avatar, Input } from '../components/ui';
import { updateProfile } from '../services/api.js';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    role: user?.role || '',
    location: user?.location || ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await updateProfile(formData);
      // Use updateUser from AuthContext to update the user state and localStorage without redirecting
      updateUser(updatedUser); 
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      role: user?.role || '',
      location: user?.location || ''
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and preferences.</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="gap-2"
                disabled={loading}
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="gap-2"
                disabled={loading}
              >
                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1 p-6 text-center space-y-4 bg-white dark:bg-gray-900">
          <div className="relative inline-block group">
            <Avatar name={user.username} size="lg" className="w-32 h-32 mx-auto ring-4 ring-blue-50 dark:ring-blue-900/20" />
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer active:scale-95">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{formData.role}</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100 dark:border-blue-800">Free User</span>
            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase tracking-wider border border-green-100 dark:border-green-800">Early Adopter</span>
          </div>
        </Card>

        {/* Info Area */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 space-y-8 bg-white dark:bg-gray-900">
            <section className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <UserIcon className="w-3 h-3" /> Full Name
                  </label>
                  {isEditing ? (
                    <Input 
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value})} 
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{user.username}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  {isEditing ? (
                    <Input 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{user.email || 'not provided'}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <Briefcase className="w-3 h-3" /> Role
                  </label>
                  {isEditing ? (
                    <Input 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})} 
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{formData.role || 'not provided'}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe className="w-3 h-3" /> Location
                  </label>
                  {isEditing ? (
                    <Input 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{formData.location || 'not provided'}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Biography</h3>
              <div className="space-y-1.5">
                {isEditing ? (
                  <textarea 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm h-32 resize-none transition-all text-gray-900 dark:text-gray-100"
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    {formData.bio || "No biography provided."}
                  </p>
                )}
              </div>
            </section>

            <section className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-8">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Joined Feb 2026</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">No Active Subscription</span>
              </div>
            </section>
          </Card>

          {/* Security Area */}
          <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <Key className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Security & Password</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Keep your account secure with a strong password.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto justify-start sm:justify-center gap-3 h-12 text-gray-700 dark:text-gray-300 dark:border-gray-700"
                onClick={() => showToast("Password update flow coming soon!", "info")}
              >
                Update Password
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

