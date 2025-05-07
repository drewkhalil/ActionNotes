import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppUser } from '../types/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  LogOut,
  Trash2,
  Save,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  user: AppUser | null;
  setActiveView: React.Dispatch<
    React.SetStateAction<
      'home' | 'tools' | 'history' | 'settings' | 'teach' | 'recap' | 'flashcards' | 'quiz' | 'studyTechniques'
    >
  >;
  onLogout: () => Promise<void>;
}

export default function Settings({ user, setActiveView, onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logoutAlertOpen, setLogoutAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the first letter for the profile picture placeholder
  const getProfileInitial = () => {
    if (fullName.trim()) {
      return fullName.trim()[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U'; // Fallback for "User"
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      // Update user metadata (full_name, phone) and username (display_name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          username: displayName,
        },
      });

      if (updateError) throw updateError;

      // Update password if provided
      if (currentPassword && newPassword && confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
          throw new Error('New password and confirmation do not match.');
        }

        // Supabase requires re-authentication to update the password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email || '',
          password: currentPassword,
        });

        if (signInError) throw new Error('Current password is incorrect.');

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;

        // Clear password fields after successful update
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }

      setError(null);
      setHasChanges(false);
      alert('Changes saved successfully!');
    } catch (err: any) {
      console.error('Error saving changes:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
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

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setHasChanges(true);
  };

  const handleProfilePictureChange = () => {
    console.log('Profile picture change clicked');
  };

  const handleProfilePictureRemove = () => {
    console.log('Profile picture remove clicked');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-6 px-4">
      {/* Main Container */}
      <div className="w-full max-w-3xl rounded-lg border bg-white p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">SETTINGS</h1>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            variant="outline"
            className="border-gray-300 text-black hover:bg-gray-100 min-w-fit px-4 flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            SAVE CHANGES
          </Button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Account Information Section */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">ACCOUNT INFORMATION</h2>
        <p className="text-sm text-gray-600 mb-6">Update your account details and preferences.</p>

        {/* Profile Picture */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 text-white text-2xl font-semibold">
            {getProfileInitial()}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium uppercase text-gray-700">
              PROFILE PICTURE
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleProfilePictureChange}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 min-w-fit px-4"
              >
                CHANGE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProfilePictureRemove}
                className="border-red-600 text-red-600 hover:bg-red-50 min-w-fit px-4"
              >
                REMOVE
              </Button>
            </div>
          </div>
        </div>

        {/* Account Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="space-y-1">
            <Label htmlFor="full-name" className="text-xs font-medium uppercase text-gray-700">
              FULL NAME
            </Label>
            <div className="rounded-md border border-gray-200">
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => handleFieldChange(setFullName, e.target.value)}
                placeholder="Enter your full name"
                className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="display-name" className="text-xs font-medium uppercase text-gray-700">
              DISPLAY NAME
            </Label>
            <div className="rounded-md border border-gray-200">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => handleFieldChange(setDisplayName, e.target.value)}
                placeholder="Enter your display name"
                className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium uppercase text-gray-700">
              EMAIL
            </Label>
            <div className="rounded-md border border-red-200 p-2">
              <span className="text-sm text-gray-700">{user?.email || 'Not available'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-medium uppercase text-gray-700">
              PHONE (OPTIONAL)
            </Label>
            <div className="rounded-md border border-gray-200">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                placeholder="Enter your phone number"
                className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={() => setLogoutAlertOpen(true)}
            className="border-gray-300 text-gray-900 hover:bg-gray-100 min-w-fit px-4 flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>

        {/* Password Section */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">PASSWORD</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="space-y-1">
            <Label htmlFor="current-password" className="text-xs font-medium uppercase text-gray-700">
              CURRENT PASSWORD
            </Label>
            <div className="rounded-md border border-gray-200">
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => handleFieldChange(setCurrentPassword, e.target.value)}
                placeholder="Enter current password"
                className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-password" className="text-xs font-medium uppercase text-gray-700">
                NEW PASSWORD
              </Label>
              <div className="rounded-md border border-gray-200">
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleFieldChange(setNewPassword, e.target.value)}
                  placeholder="Enter new password"
                  className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-new-password" className="text-xs font-medium uppercase text-gray-700">
                CONFIRM NEW PASSWORD
              </Label>
              <div className="rounded-md border border-gray-200">
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => handleFieldChange(setConfirmNewPassword, e.target.value)}
                  placeholder="Confirm new password"
                  className="border-0 p-2 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">DANGER ZONE</h2>
          <div className="rounded-md border border-red-200 bg-red-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-red-500">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setDeleteAlertOpen(true)}
                className="bg-red-600 hover:bg-red-700 min-w-fit px-4 flex items-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutAlertOpen} onOpenChange={setLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account and returned to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}