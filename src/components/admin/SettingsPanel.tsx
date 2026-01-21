import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Loader2, Store, CreditCard } from 'lucide-react';

interface Settings {
  store_name: string;
  upi_id: string;
  upi_qr_image: string;
}

export const SettingsPanel = () => {
  const [settings, setSettings] = useState<Settings>({
    store_name: '',
    upi_id: '',
    upi_qr_image: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap: Settings = {
        store_name: '',
        upi_id: '',
        upi_qr_image: '',
      };

      data?.forEach((item) => {
        if (item.key in settingsMap) {
          settingsMap[item.key as keyof Settings] = item.value;
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('store_settings')
          .update({ value })
          .eq('key', key);

        if (error) throw error;
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qr-code-${Date.now()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, upi_qr_image: publicUrl }));
      toast.success('QR code uploaded! Remember to save settings.');
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast.error('Failed to upload QR code');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Settings */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Store Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="store_name">Store Name</Label>
            <Input
              id="store_name"
              value={settings.store_name}
              onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
              placeholder="Enter your store name"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">UPI Payment Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="upi_id">UPI ID</Label>
            <Input
              id="upi_id"
              value={settings.upi_id}
              onChange={(e) => setSettings(prev => ({ ...prev, upi_id: e.target.value }))}
              placeholder="yourname@upi"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This UPI ID will be shown to customers during checkout
            </p>
          </div>

          <div>
            <Label>UPI QR Code (Optional)</Label>
            <div className="mt-2 space-y-3">
              {settings.upi_qr_image && (
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-white">
                  <img
                    src={settings.upi_qr_image}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                  id="qr-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('qr-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {settings.upi_qr_image ? 'Change QR' : 'Upload QR'}
                </Button>
                {settings.upi_qr_image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, upi_qr_image: '' }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your UPI QR code image. If not provided, a QR will be auto-generated.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  );
};
