import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppUser } from '../types/types';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@radix-ui/react-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { LogOut, Trash2, Save, Eye, EyeOff, Upload } from 'lucide-react';

interface SettingsProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques' | 'calendar' | 'projects' | 'analytics'
    >
  >;
  onLogout: () => Promise<void>;
}

const getAvatarInitial = (user: AppUser | null) => {
  if (!user) return 'U';
  return user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
};

export default function Settings({ user, setActiveView, onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logoutAlertOpen, setLogoutAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          username: displayName,
        },
      });

      if (updateError) throw updateError;

      setError(null);
      setHasChanges(false);
      alert('Changes saved successfully!');
    } catch (err: any) {
      console.error('Error saving changes:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    try {
      if (newPassword !== confirmNewPassword) {
        throw new Error('New password and confirmation do not match.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect.');

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) throw passwordError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordDialogOpen(false);
      setError(null);
      alert('Password updated successfully!');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    }
  };

  const handleLogout = async () => {
    await onLogout();
    setActiveView('home');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      await supabase.auth.signOut();
      setActiveView('home');
      navigate('/');
      alert('Account deletion requested. Please contact support to complete this action.');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, or GIF files are supported.');
      return;
    }

    try {
      const filePath = `${user.id}/avatar_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: urlData.publicUrl,
        },
      });
      if (updateError) throw updateError;

      setError(null);
      alert('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err.message || 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleProfilePictureRemove = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: null,
        },
      });
      if (updateError) throw updateError;

      setError(null);
      alert('Profile picture removed successfully!');
    } catch (err: any) {
      console.error('Error removing profile picture:', err);
      setError(err.message || 'Failed to remove profile picture. Please try again.');
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#171512] group/design-root overflow-x-hidden" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-10 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Title */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-white tracking-tight text-[32px] font-bold leading-tight min-w-72">Settings</p>
            </div>
            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md border border-[#4f4b40] bg-[#25231e] p-3 text-sm text-[#c69d3d]">
                {error}
              </div>
            )}
            {/* Avatar Section */}
            <div className="flex p-4 @container">
              <div className="flex w-full flex-col gap-4 items-start">
                <div className="flex gap-4 flex-col items-start">
                  {user?.user_metadata?.avatar_url ? (
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32"
                      style={{ backgroundImage: `url("${user.user_metadata.avatar_url}")` }}
                    ></div>
                  ) : (
                    <div
                      className="flex items-center justify-center aspect-square rounded-full min-h-32 w-32 bg-[#4f4b40] text-white text-4xl font-semibold"
                    >
                      {getAvatarInitial(user)}
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">{fullName || 'User'}</p>
                    <p className="text-[#b4afa2] text-base font-normal leading-normal">{user?.email || 'Not available'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#36332b] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full max-w-[480px] @[480px]:w-auto"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="truncate">Change Avatar</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif"
                  />
                  {user?.user_metadata?.avatar_url && (
                    <button
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#4f4b40] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full max-w-[480px] @[480px]:w-auto"
                      onClick={handleProfilePictureRemove}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="truncate">Remove Avatar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Account Information */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Name</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] text-base font-normal leading-normal"
                  value={fullName}
                  onChange={(e) => handleFieldChange(setFullName, e.target.value)}
                  placeholder="Enter your full name"
                />
              </label>
            </div>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Username</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] text-base font-normal leading-normal"
                  value={displayName}
                  onChange={(e) => handleFieldChange(setDisplayName, e.target.value)}
                  placeholder="Enter your username"
                />
              </label>
            </div>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Email</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] text-base font-normal leading-normal"
                  value={user?.email || ''}
                  disabled
                />
              </label>
            </div>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">Phone (Optional)</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] text-base font-normal leading-normal"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                  placeholder="Enter your phone number"
                />
              </label>
            </div>
            {/* Action Buttons */}
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#36332b] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <span className="truncate">Change Password</span>
                </button>
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#c69d3d] text-[#171512] text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={handleSaveChanges}
                  disabled={!hasChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  <span className="truncate">Save Changes</span>
                </button>
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#36332b] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={() => setLogoutAlertOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="truncate">Log Out</span>
                </button>
              </div>
            </div>
            {/* Danger Zone */}
            <div className="px-4 py-3">
              <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-2">Danger Zone</h2>
              <div className="rounded-md border border-[#4f4b40] bg-[#25231e] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-base font-medium leading-normal">Delete Account</p>
                    <p className="text-[#b4afa2] text-sm font-normal">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#c69d3d] text-[#171512] text-sm font-bold leading-normal tracking-[0.015em]"
                    onClick={() => setDeleteAlertOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span className="truncate">Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-[#171512] border-[#36332b] rounded-lg shadow-xl z-50 p-6">
          <DialogTitle className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">Change Password</DialogTitle>
          <div className="space-y-4">
            <div className="flex flex-col min-w-40 flex-1">
              <Label className="text-white text-base font-medium leading-normal pb-2">Current Password</Label>
              <div className="flex w-full flex-1 items-stretch rounded-xl">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                  value={currentPassword}
                  onChange={(e) => handleFieldChange(setCurrentPassword, e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  className="text-[#b4afa2] flex border border-[#4f4b40] bg-[#25231e] items-center justify-center pr-[15px] rounded-r-xl border-l-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col min-w-40 flex-1">
              <Label className="text-white text-base font-medium leading-normal pb-2">New Password</Label>
              <div className="flex w-full flex-1 items-stretch rounded-xl">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                  value={newPassword}
                  onChange={(e) => handleFieldChange(setNewPassword, e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  className="text-[#b4afa2] flex border border-[#4f4b40] bg-[#25231e] items-center justify-center pr-[15px] rounded-r-xl border-l-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col min-w-40 flex-1">
              <Label className="text-white text-base font-medium leading-normal pb-2">Confirm New Password</Label>
              <div className="flex w-full flex-1 items-stretch rounded-xl">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#4f4b40] bg-[#25231e] focus:border-[#4f4b40] h-14 placeholder:text-[#b4afa2] p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                  value={confirmNewPassword}
                  onChange={(e) => handleFieldChange(setConfirmNewPassword, e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  className="text-[#b4afa2] flex border border-[#4f4b40] bg-[#25231e] items-center justify-center pr-[15px] rounded-r-xl border-l-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#36332b] text-white text-sm font-bold leading-normal tracking-[0.015em]"
              onClick={() => {
                setPasswordDialogOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
            >
              <span className="truncate">Cancel</span>
            </button>
            <button
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#c69d3d] text-[#171512] text-sm font-bold leading-normal tracking-[0.015em]"
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmNewPassword}
            >
              <span className="truncate">Update Password</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutAlertOpen} onOpenChange={setLogoutAlertOpen}>
        <AlertDialogContent className="bg-[#171512] border-[#36332b]">
          <AlertDialogTitle className="text-white">Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b4afa2]">
            You will be signed out of your account and returned to the login page.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#36332b] text-white hover:bg-[#4f4b40]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#c69d3d] text-[#171512] hover:bg-[#b38c30]"
              onClick={handleLogout}
            >
              Log Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="bg-[#171512] border-[#36332b]">
          <AlertDialogTitle className="text-white">Are you sure you want to delete your account?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#b4afa2]">
            This action cannot be undone. All your data will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="bg-[#36332b] text-white hover:bg-[#4f4b40]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#c69d3d] text-[#171512] hover:bg-[#b38c30]"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}