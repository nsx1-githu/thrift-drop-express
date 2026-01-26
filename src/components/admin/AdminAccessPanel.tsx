import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Key, Loader2, Shield, UserPlus, RefreshCw, Save } from 'lucide-react';

export const AdminAccessPanel = () => {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAdminKey();
  }, []);

  const fetchAdminKey = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('get-admin-key', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch admin key');
      }

      if (response.data?.key) {
        setAdminKey(response.data.key);
      } else if (response.data?.error) {
        setError(response.data.error);
      }
    } catch (err) {
      console.error('Error fetching admin key:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKey = async () => {
    if (!newKey || newKey.length < 8) {
      toast.error('New key must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('update-admin-key', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { newKey },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update admin key');
      }

      if (response.data?.success) {
        setAdminKey(newKey);
        setNewKey('');
        setIsEditing(false);
        toast.success('Admin key updated successfully');
      } else if (response.data?.error) {
        toast.error(response.data.error);
      }
    } catch (err) {
      console.error('Error updating admin key:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update admin key');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!adminKey) return;
    
    try {
      await navigator.clipboard.writeText(adminKey);
      toast.success('Admin key copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const maskedKey = adminKey ? '•'.repeat(Math.min(adminKey.length, 20)) : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Signup Key */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Admin Signup Key</h3>
          </div>
          {!isEditing && adminKey && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey(adminKey);
                setIsEditing(true);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Change Key
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this secret key with trusted people who need admin access. 
            They'll need to enter this key during admin signup.
          </p>

          {error ? (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAdminKey}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : isEditing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="new_admin_key">New Admin Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="new_admin_key"
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter new admin key (min 8 characters)"
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters. Use a strong, unique key.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateKey}
                  disabled={isSaving || newKey.length < 8}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save New Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setNewKey('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="admin_key">Secret Key</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="admin_key"
                      type={showKey ? 'text' : 'password'}
                      value={showKey ? (adminKey || '') : maskedKey}
                      readOnly
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    disabled={!adminKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How to Add New Admin */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">How to Add a New Admin</h3>
        </div>
        
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>Copy the Admin Signup Key above</li>
          <li>Share it securely with the new admin (in person, encrypted message, etc.)</li>
          <li>
            Direct them to the admin login page using the secret gesture:
            <ul className="ml-6 mt-1 space-y-1 list-disc">
              <li>Desktop: Press 'A' key 5 times quickly</li>
              <li>Mobile: Tap the store logo 5 times</li>
            </ul>
          </li>
          <li>They should click "Create Account" and enter the signup key</li>
          <li>Once signed up, they'll have full admin access</li>
        </ol>
      </div>

      {/* Security Notice */}
      <div className="bg-muted/50 rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-sm">Security Notice</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Keep this key confidential. Anyone with this key can create an admin account. 
          If you suspect the key has been compromised, use the "Change Key" button above to generate a new one.
        </p>
      </div>
    </div>
  );
};
