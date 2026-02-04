import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { api, Customer } from '../../services/api';

const PortalScan: React.FC = () => {
  const navigate = useNavigate();
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null); // To store namecard_id
  
  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    customer_company_name: '',
    job_title: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    status: 'lead'
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (side === 'front') {
        setFrontImage(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleScan = async () => {
    if (!frontImage) return;

    setIsScanning(true);
    try {
      const form = new FormData();
      form.append('front_image', frontImage);
      if (backImage) {
        form.append('back_image', backImage);
      }

      const result = await api.scanNamecard(form);
      
      setScanResult(result);
      setFormData(prev => ({
        ...prev,
        ...result.extracted_fields
      }));
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Failed to scan namecard. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        namecard_id: scanResult?.namecard_id
      };
      
      const newCustomer = await api.createCustomer(payload);
      // For portal, navigate back to list or profile. 
      // Since profile is /crm/customers/:id and shared, we can use that if permitted,
      // but let's stick to Portal Home for now or implement a Portal Profile view.
      // Redirect to home as requested earlier for "My Leads"
      navigate(`/portal`); 
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof Customer, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal')} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">Scan Namecard</h1>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Image Uploads */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-slate-500">Front Image (Required)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 m-4 rounded-lg bg-slate-50">
                {frontPreview ? (
                  <div className="relative w-full aspect-[1.58] bg-slate-100 rounded-lg overflow-hidden mb-4">
                    <img src={frontPreview} alt="Front" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Tap to capture or upload</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => handleImageChange(e, 'front')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-slate-500">Back Image (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 m-4 rounded-lg bg-slate-50">
                 {backPreview ? (
                  <div className="relative w-full aspect-[1.58] bg-slate-100 rounded-lg overflow-hidden mb-4">
                    <img src={backPreview} alt="Back" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Tap to capture or upload</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => handleImageChange(e, 'back')}
                />
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleScan} 
              disabled={!frontImage || isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Run OCR'
              )}
            </Button>
          </div>

          {/* Right Column: Form */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => handleChange('full_name', e.target.value)} 
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={formData.customer_company_name} 
                    onChange={(e) => handleChange('customer_company_name', e.target.value)} 
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input 
                    value={formData.job_title} 
                    onChange={(e) => handleChange('job_title', e.target.value)} 
                    placeholder="e.g. CEO"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={formData.email} 
                      onChange={(e) => handleChange('email', e.target.value)} 
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => handleChange('phone', e.target.value)} 
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    value={formData.website} 
                    onChange={(e) => handleChange('website', e.target.value)} 
                    placeholder="www.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={formData.address} 
                    onChange={(e) => handleChange('address', e.target.value)} 
                    placeholder="123 Street Name, City"
                  />
                </div>

                 <div className="pt-4">
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={handleSave}
                    disabled={isSaving || !formData.full_name}
                  >
                     {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Customer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalScan;
